import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from '@sequelize/core';

class prohibitedWords extends Model {
  declare public word: string;
}

export class ProhibitedWordsSvc {
  private model: typeof prohibitedWords;

  constructor() {
    this.model = prohibitedWords;
    this.model.init({
      word: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
      }
    }, {
      tableName: 'prohibitedwords',
      createdAt: false,
      updatedAt: false,
      sequelize: DatabaseServer.seq
    })
    this.model.sync();
  }
  findWord = async(word:string)=>await this.model.findByPk(word);
  getAllWords = async()=>await this.model.findAll();
  insertWord = async(word:string)=>await this.model.create({word});
  removeWord = async(word:string)=>await this.model.destroy({where: {word}})
}
