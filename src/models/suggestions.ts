import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from '@sequelize/core';

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
  fetchById = async(id:number)=>await this.model.findByPk(id);
  updateStatus = async(id:number, status:string)=>await this.model.update({status}, {where: {id}});
  create =(userid:string, description:string)=>this.model.create({userid, suggestion: description, status: 'Pending'})
  delete =(id:number)=>this.model.destroy({where: {id}});
}
