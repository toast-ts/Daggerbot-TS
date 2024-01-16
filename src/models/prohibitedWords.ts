import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from 'sequelize';
import {get} from 'node:https';

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
  async importWords(file:string) {
    const jsonData = await new Promise<string>((resolve, reject)=>{
      get(file, res=>{
        let data = '';
        res.on('data', chunk=>data += chunk);
        res.on('end', ()=>resolve(data));
        res.on('error', reject);
      })
    });

    const data = JSON.parse(jsonData);
    const dataMapping = data.map((x:string)=>({word: x}));
    try {
      await this.model.bulkCreate(dataMapping, {ignoreDuplicates: true});
      return true;
    } catch(err) {
      throw new Error(`Failed to insert words into Postgres database: ${err.message}`)
    }
  }
  getAllWords = async()=>await this.model.findAll();
  insertWord = async(word:string)=>await this.model.create({word: word});
  removeWord = async(word:string)=>await this.model.destroy({where: {word: word}})
}
