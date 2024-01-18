import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from 'sequelize';
import {writeFileSync} from 'node:fs';
import cron from 'node-cron';
import Logger from '../helpers/Logger.js';

class userLevels extends Model {
  declare public id: string;
  declare public messages: number;
  declare public level: number;
  declare public pingToggle: boolean;
  declare public time: number;
  declare public isBlocked: boolean;
}

export class UserLevelsSvc {
  private client: TClient;
  private model: typeof userLevels;

  constructor(client:TClient) {
    this.client = client;
    this.model = userLevels;
    this.model.init({
      id: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true
      },
      messages: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      level: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      pingToggle: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      time: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      isBlocked: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      }
    }, {
      tableName: 'userlevels',
      createdAt: false,
      updatedAt: false,
      sequelize: DatabaseServer.seq
    });
    this.model.sync();
  }
  fetchEveryone = async()=>await this.model.findAll();
  fetchUser = async(userId:string)=>await this.model.findByPk(userId);
  deleteUser = async(userId:string)=>await this.model.destroy({where: {id: userId}});
  async modifyUser(userId:string, updatedMessages:number) {
    await this.model.update({messages: updatedMessages}, {where: {id: userId}});
    return (await this.model.findByPk(userId)).dataValues;
  }
  async blockUser(userId:string, duration:number):Promise<boolean> {
    const data = await this.model.findByPk(userId);
    if (data && data.dataValues.isBlocked) return false;
    else if (data) {
      await this.model.update({time: duration, isBlocked: true}, {where: {id: userId}});
      return true;
    }
  }
  async getActiveUsers() {
    const members = (await this.model.findAll()).sort((a,b)=>b.dataValues.messages-a.dataValues.messages);
    return members.slice(0, 5);
  }
  async messageIncremental(userId:string) {
    const data = await this.model.findByPk(userId);
    if (data && data.dataValues.isBlocked) return;
    if (data) {
      await this.model.update({messages: data.dataValues.messages + 1}, {where: {id: userId}});
      if (data.messages >= this.algorithm(data.dataValues.level+2)) {
        const oldLevel = data.dataValues.level;
        while (data.messages > this.algorithm(data.dataValues.level+1)) await this.model.update({level: data.dataValues.level++}, {where: {id: userId}});
        const updatedUser = await this.model.findByPk(userId);
        Logger.console('log', 'LevelSystem', `${userId} superseded to level ${updatedUser.dataValues.level} from ${oldLevel}`);
      } else if (data.dataValues.messages >= this.algorithm(data.dataValues.level+1)) {
        await this.model.update({level: data.dataValues.level+1}, {where: {id: userId}});
        const getUser = await this.model.findByPk(userId);
        const levelUpMsg = `${getUser.pingToggle === true ? `<@${userId}>` : `**${(await this.client.users.fetch(userId)).displayName}**`} has reached level **${getUser.level}**. Well done!`;
        (this.client.channels.resolve(this.client.config.dcServer.channels.botcommands) as Discord.TextChannel).send({content: levelUpMsg, allowedMentions: {parse: ['users']}});
      }
    } else await this.model.create({id: userId, messages: 1, level: 0, pingToggle: true, isBlocked: false});
  }
  async dataSweeper() {
    // Every Monday at 12:00 (Sydney Time)
    cron.schedule('0 12 * * 1', async()=>{
      Logger.console('log', 'Cron', 'Running job "dataSweeper", this is activated every Monday at 12:00');
      const fetchDiscordMembers = await this.client.guilds.cache.get(this.client.config.dcServer.id).members.fetch();
      const fetchUsers = await this.model.findAll();
      for (const user of fetchUsers) {
        if (!fetchDiscordMembers.has(user.dataValues.id)) {
          await this.deleteUser(user.dataValues.id);
          Logger.console('log', 'Cron:dataSweeper', `Removing ${user.dataValues.id}`);
        }
      }
      Logger.console('log', 'Cron:dataSweeper', 'Job completed');
    })
  }
  async initSelfdestruct() {
    // Every 1st of January at 11:00 (Midnight in London, Middayish in Sydney)
    cron.schedule('0 11 1 1 *', async()=>{
      Logger.console('log', 'Cron', 'Running job "resetAllData", this is activated every 1st of January');
      const performCountBeforeReset = await this.model.count();
      const topMembers = await this.getActiveUsers();

      Logger.console('log', 'Cron:resetAllData', `Counted ${performCountBeforeReset.toLocaleString()} members before reset`);
      await this.client.dailyMsgs.nukeDays();
      await this.model.drop().then(async()=>await this.model.sync());

      try {
        // Send notification to dcServer's logs channel after cronjob is complete.
        (this.client.channels.resolve(this.client.config.dcServer.channels.logs) as Discord.TextChannel).send({embeds: [new this.client.embed()
          .setColor('#A3FFE3')
          .setTitle('Yearly data reset has begun!')
          .setDescription(MessageTool.concatMessage(
            'I have gone ahead and reset everyone\'s rank data.',
            `There was ${Intl.NumberFormat('en-US').format(performCountBeforeReset)} members in database before reset.\n`,
            'Top 5 most active members:',
            ...topMembers.map((m,i)=>`${i+1}. **${(this.client.users.resolve(m.dataValues.id) ? this.client.users.resolve(m.dataValues.id).displayName : '*Unknown User*')}** - **${m.dataValues.messages.toLocaleString()}** messages`)
          ))
        ]});
      } catch (why) {
        Logger.debug('Cron:resetAllData', why)
      }

      // Reset LRSstart to current Epoch and save it to config file
      const newEpoch = new Date().getTime();
      this.client.config.LRSstart = newEpoch;
      const logText = `Resetting LRSstart to \`${newEpoch}\`, saved to config file`;
      Logger.console('log', 'DailyMsgs', logText);
      (this.client.channels.resolve(this.client.config.dcServer.channels.logs) as Discord.TextChannel).send({embeds: [new this.client.embed()
        .setColor(this.client.config.embedColorXmas)
        .setTitle('Happy New Years! Level System is clean!')
        .setDescription(logText)
      ]}).catch(err=>console.log(err));
      writeFileSync('src/config.json', JSON.stringify(this.client.config, null, 2));
      Logger.console('log', 'Cron:resetAllData', 'Job completed');
    })
  }
  algorithm = (level:number)=>level*level*15;
  // Algorithm for determining levels. If adjusting, recommended to only change the integer at the end of equation.
  // Requires rank data to be reset if changed as it causes unexpected results.
}
