import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from 'sequelize';

class suggestions extends Model {
  declare public id: number;
  declare public suggestion: string;
  declare public userid: string;
  declare public status: string;
}

export class SuggestionsSvc {
  private model: typeof suggestions;

  constructor() {
    this.model = suggestions;
    this.model.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        unique: true,
        primaryKey: true
      },
      suggestion: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      userid: {
        type: DataTypes.STRING,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      tableName: 'suggestions',
      createdAt: false,
      updatedAt: false,
      sequelize: DatabaseServer.seq
    })
    this.model.sync();
  }
  async fetchById(id:number) {
    return await this.model.findByPk(id);
  }
  async updateStatus(id:number, status:string) {
    return await this.model.update({status: status}, {where: {id: id}})
  }
  async create(userid:string, description:string) {
    return this.model.create({userid: userid, suggestion: description, status: 'Pending'})
  }
  async delete(id:number) {
    return this.model.destroy({where: {id: id}});
  }
}
