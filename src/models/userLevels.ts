import Discord from 'discord.js';
import TClient from '../client.js';
import mongoose from 'mongoose';
import LogPrefix from '../helpers/LogPrefix.js';

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
  async incrementUser(userid:string){
    const userData = await this._content.findById(userid)
    if (userData){
      await this._content.findByIdAndUpdate(userid, {messages: userData.messages + 1});
      if (userData.messages >= this.algorithm(userData.level+2)){
        while (userData.messages > this.algorithm(userData.level+1)){
          const newData = await this._content.findByIdAndUpdate(userid, {level:userData.level++}, {new: true});
          console.log(this.client.logTime(), LogPrefix('LevelSystem'), `${userid} extended to level ${newData.level}`);
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
