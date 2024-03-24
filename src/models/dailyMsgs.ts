import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from '@sequelize/core';
import Logger from '../helpers/Logger.js';

class dailyMsgs extends Model {
  declare public day: number;
  declare public total: number;
}

export class DailyMsgsSvc {
  private model: typeof dailyMsgs;

  constructor() {
    this.model = dailyMsgs;
    this.model.init({
      day: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        unique: true,
        primaryKey: true
      },
      total: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    }, {
      tableName: 'dailymsgs',
      createdAt: false,
      updatedAt: false,
      indexes: [{name: 'day_index', fields: ['day'], unique: true}],
      sequelize: DatabaseServer.seq
    })
    this.model.sync();
  }
  nukeDays = async()=>await this.model.destroy();
  fetchDays = async()=>await this.model.findAll();
  async newDay(formattedDate:number, total:number) {
    const [instance, created] = await this.model.findOrCreate({where: {day: formattedDate}, defaults: {total}});
    if (!created) return Logger.console('log', 'DailyMsgs', 'This day already exists!');
    return instance
    // Save previous day's total messages into database when a new day starts.
  }
}
