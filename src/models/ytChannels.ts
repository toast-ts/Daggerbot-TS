import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from 'sequelize';

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
  async getChannels() {
    return await this.model.findAll();
  }
  async addChannel(YTChannelID:string, DCChannelID:string, DCRole:string) {
    if (await this.model.findOne({where: {ytchannel: YTChannelID}})) return false;
    await this.model.create({ytchannel: YTChannelID, dcchannel: DCChannelID, dcrole: DCRole});
    return true;
  }
  async delChannel(YTChannelID:string) {
    return await this.model.destroy({where: {ytchannel: YTChannelID}});
  }
}
