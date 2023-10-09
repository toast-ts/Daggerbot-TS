import Discord from 'discord.js';
import TClient from '../client.js';
import mongoose from 'mongoose';
import cron from 'node-cron';
import {writeFileSync, readFileSync} from 'node:fs';
import Logger from '../helpers/Logger.js';

const Schema = mongoose.model('userLevels', new mongoose.Schema({
  _id: {type: String},
  messages: {type: Number, required: true},
  level: {type: Number, required: true},
  notificationPing: {type: Boolean}
}, {versionKey: false}));

export default class userLevels extends Schema {
  client: TClient;
  _content: typeof Schema;
  constructor(client:TClient){
    super();
    this.client = client;
    this._content = Schema;
  }
  async resetAllData(){
    // Every 1st of January at 11:00 (Midnight in London, 11AM in Sydney)
    cron.schedule('0 11 1 1 *', async()=>{
      Logger.forwardToConsole('log', 'Cron', 'Running job "resetAllData", this is activated every 1st of January');
      const countDataBeforeReset = await this._content.countDocuments();
      Logger.forwardToConsole('log', 'Cron:resetAllData', `Counted ${countDataBeforeReset.toLocaleString()} documents before reset`);
      await this._content.deleteMany();
      Logger.forwardToConsole('log', 'Cron:resetAllData', 'Deleted all documents, now resetting dailyMsgs');
      const dailyMsgsBak = readFileSync('src/database/dailyMsgs.json', 'utf-8');
      writeFileSync(`src/database/dailyMsgs_${new Date().getTime()}.json`, dailyMsgsBak);
      writeFileSync('src/database/dailyMsgs.json', JSON.stringify([]));
      // Send notification to mainServer's logs channel after cronjob is complete.
      (this.client.channels.resolve(this.client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [new this.client.embed().setColor('#A3FFE3').setTitle('Yearly data reset has begun!').setDescription(`I have gone ahead and reset everyone's rank data. There was ${Intl.NumberFormat('en-US').format(await countDataBeforeReset)} documents in database before reset.`).setFooter({text: 'dailyMsgs has been backed up and wiped too.'}).setTimestamp()]});

      // Reset LRSstart to current epoch and write it to config file
      const newEpoch = new Date().getTime();
      this.client.config.LRSstart = newEpoch;
      const logText = `Resetting LRSstart to \`${newEpoch}\`, saved to config file`;
      Logger.forwardToConsole('log', 'DailyMsgs', logText);
      (this.client.channels.resolve(this.client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [new this.client.embed().setColor(this.client.config.embedColorXmas).setTitle('Happy New Years! Level System is clean!').setDescription(logText).setTimestamp()]}).catch(err=>console.log(err));
      writeFileSync('./src/config.json', JSON.stringify(this.client.config, null, 2));
      Logger.forwardToConsole('log', 'Cron:resetAllData', 'Job completed');
    })
  }
  async incrementUser(userid:string){
    const userData = await this._content.findById(userid)
    if (userData){
      await this._content.findByIdAndUpdate(userid, {messages: userData.messages + 1});
      if (userData.messages >= this.algorithm(userData.level+2)){
        while (userData.messages > this.algorithm(userData.level+1)){
          const newData = await this._content.findByIdAndUpdate(userid, {level:userData.level++}, {new: true});
          Logger.forwardToConsole('log', 'LevelSystem', `${userid} extended to level ${newData.level}`);
        }
      } else if (userData.messages >= this.algorithm(userData.level+1)) {
        const newData = await this._content.findByIdAndUpdate(userid, {level:userData.level+1}, {new: true});
        const fetchUserSchema = await this._content.findById(userid);
        (this.client.channels.resolve(this.client.config.mainServer.channels.botcommands) as Discord.TextChannel).send({content: `${fetchUserSchema.notificationPing === true ? `<@${userid}>` : `**${(await this.client.users.fetch(userid)).displayName}**`} has reached level **${newData.level}**. GG!`, allowedMentions: {parse: ['users']}}); 
      }
    } else await this._content.create({_id: userid, notificationPing: true, messages: 1, level: 0})
  }
  algorithm = (level:number)=>level*level*15;
// Algorithm for determining levels. If adjusting, recommended to only change the integer at the end of equation.
}
