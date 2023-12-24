import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from 'sequelize';

class bonkCount extends Model {
  declare public id: string;
  declare public count: number;
}

export class BonkCountSvc {
  private model: typeof bonkCount;

  constructor(){
    this.model = bonkCount;
    this.model.init({
      id: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true
      },
      count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    }, {
      tableName: 'bonkcount',
      createdAt: false,
      updatedAt: false,
      sequelize: DatabaseServer.seq
    });
    this.model.sync();
  }
  async hitCountIncremental(userId:string) {
    const getUser = await this.model.findByPk(userId);
    if (getUser) getUser.increment('count');
    else await this.model.create({id: userId, count: 1});
    return this;
  }
  async fetchUser(userId:string) {
    const getUser = await this.model.findByPk(userId);
    if (getUser) return getUser.dataValues;
    else return 0;
  }
}
