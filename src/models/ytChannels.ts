import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from '@sequelize/core';

class youtubeChannels extends Model {
  declare public ytchannel: string;
  declare public dcchannel: string;
  declare public dcrole: string;
}

export class YouTubeChannelsSvc {
  private model: typeof youtubeChannels;

  constructor() {
    this.model = youtubeChannels;
    this.model.init({
      ytchannel: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      dcchannel: {
        type: DataTypes.STRING,
        allowNull: false
      },
      dcrole: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      tableName: 'ytchannels',
      createdAt: false,
      updatedAt: false,
      sequelize: DatabaseServer.seq
    })
    this.model.sync();
  }
  query = async(pattern:string)=>await this.model.sequelize.query(pattern);
  async addChannel(YTChannelID:string, DCChannelID:string, DCRole:string) {
    const [_, created] = await this.model.findOrCreate({where: {ytchannel: YTChannelID}, defaults: {dcchannel: DCChannelID, dcrole: DCRole}});
    return created;
  }
  delChannel = async(YTChannelID:string)=>await this.model.destroy({where: {ytchannel: YTChannelID}});
  getChannels = async()=>await this.model.findAll();
}
