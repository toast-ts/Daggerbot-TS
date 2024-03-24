import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from '@sequelize/core';
import CacheServer from '../components/CacheServer.js';

class MPServer extends Model {
  declare public serverName: string;
  declare public isActive: boolean;
  declare public ip: string;
  declare public code: string;
  declare public playerData: number[];
}

export interface IServer {
  serverName: string
  isActive: boolean
  ip: string
  code: string
  playerData: number[]
}

const cacheKey = 'MPServer';

export class MPServerSvc {
  private model: typeof MPServer;

  constructor() {
    this.model = MPServer;
    this.model.init({
      serverName: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      ip: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      playerData: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: true,
      }
    }, {
      tableName: 'mpserver',
      createdAt: false,
      updatedAt: false,
      sequelize: DatabaseServer.seq,
    })
    this.model.sync();
  }
  async fetchPlayerData(serverName:string) {
    const server = await this.model.findOne({where: {serverName}});
    return server.dataValues.playerData ??= [];
  }
  async addServer(serverName:string, ip:string, code:string) {
    await this.model.upsert({
      serverName,
      isActive: true,
      ip,
      code,
      playerData: []
    });
    await CacheServer.delete(cacheKey).then(async()=>await this.findInCache());
  }
  async removeServer(serverName:string) {
    await this.model.destroy({where: {serverName}});
    await CacheServer.delete(cacheKey).then(async()=>await this.findInCache());
  }
  async toggleServerUsability(serverName:string, isActive:boolean) {
    const [updated] = await this.model.update({isActive}, {where: {serverName}});
    if (updated) {
      await CacheServer.delete(cacheKey).then(async()=>await this.findInCache());
      return true;
    }
    return false;
  }
  async incrementPlayerCount(serverName:string, playerCount:number) {
    const server = await this.model.findOne({where: {serverName}});
    if (server) {
      let PD = server.dataValues.playerData;
      if (PD.length > 1920) PD = []; //Selfnote: 86400/45 = 1920, where 86400 is seconds in a day and 45 is the MPModule's refresh interval.
      PD.push(playerCount);
      await this.model.update({playerData: PD}, {where: {serverName}});
      return true;
    }
    return false;
  }
  async findInCache(): Promise<IServer[]> {
    const cachedResult = await CacheServer.get(cacheKey, true);
    let result:IServer[];
    if (cachedResult) result = cachedResult;
    else {
      result = await this.model.findAll();
      CacheServer.set(cacheKey, result, true).then(()=>CacheServer.expiry(cacheKey, 1800));
    }
    return result;
  }
}
