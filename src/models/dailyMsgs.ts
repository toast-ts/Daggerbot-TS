import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from 'sequelize';

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
      sequelize: DatabaseServer.seq
    })
    this.model.sync();
  }
  async nukeDays() {
    return await this.model.destroy({truncate: true})
    // Drop a nuclear bomb on the table.
  }
  async fetchDays() {
    return await this.model.findAll();
    // Fetch every rows from database.
  }
  async newDay(formattedDate:number, total:number) {
    if (await this.model.findOne({where: {day: formattedDate}})) return console.log('This day already exists!')
    return await this.model.create({day: formattedDate, total: total});
    // Save previous day's total messages into database when a new day starts.
  }
  async updateDay(formattedDate:number, total:number) {
    return await this.model.update({total: total}, {where: {day: formattedDate}});
    // THIS IS FOR DEVELOPMENT PURPOSES ONLY, NOT TO BE USED IN LIVE ENVIRONMENT!
  }
}
