import DatabaseServer from '../components/DatabaseServer.js';
import {Model, DataTypes} from 'sequelize';
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
  async getServers() {
    return await this.model.findAll();
  }
  async fetchPlayerData(serverName:string) {
    const findServerByName = await this.model.findOne({where: {serverName: serverName}});
    if (findServerByName) return findServerByName.dataValues.playerData;
    else return [];
  }
  async addServer(serverName:string, ip:string, code:string) {
    const findServerByName = await this.model.findOne({where: {serverName: serverName}});
    if (findServerByName) {
      (await findServerByName.update({serverName: serverName, ip: ip, code: code})).save();
      await CacheServer.delete(cacheKey).then(async()=>await this.findInCache());
    } else {
      await this.model.create({
        serverName: serverName,
        isActive: true,
        ip: ip,
        code: code,
        playerData: []
      });
      await CacheServer.delete(cacheKey).then(async()=>await this.findInCache());
    }
  }
  async removeServer(serverName:string) {
    const findServerByName = await this.model.findOne({where: {serverName: serverName}});
    if (findServerByName) {
      await this.model.destroy({where: {serverName: serverName}});
      await CacheServer.delete(cacheKey).then(async()=>await this.findInCache());
    }
  }
  async toggleServerUsability(serverName:string, isActive:boolean) {
    const findServerByName = await this.model.findOne({where: {serverName: serverName}});
    if (findServerByName) {
      this.model.update({isActive: isActive}, {where: {serverName: serverName}}).then(async flagUpdated=>{
        if (flagUpdated) {
          await CacheServer.delete(cacheKey).then(async()=>await this.findInCache());
          return true;
        }
      });
    } else return false;
  }
  async incrementPlayerCount(serverName:string, playerCount:number) {
    const findServerByName = await this.model.findOne({where: {serverName: serverName}});
    if (findServerByName) {
      let PD = findServerByName.dataValues.playerData;
      if (PD.length > 256) PD = [];
      PD.push(playerCount);
      const updatePD = await this.model.update({playerData: PD}, {where: {serverName: serverName}});
      if (updatePD) true;
      else return false;
    } else return false;
  }
  async findInCache(): Promise<IServer[]> {
    const cachedResult = await CacheServer.get(cacheKey, true);
    let result;
    if (cachedResult) result = cachedResult;
    else {
      result = await this.model.findAll();
      CacheServer.set(cacheKey, result, true).then(()=>CacheServer.expiry(cacheKey, 1800));
    }
    return result;
  }
  async getServerData(serverName:string):Promise<IServer> {
    return new Promise(async resolve=>{
      const serverInfo = await this.findInCache();

      for (let i = 0; i < serverInfo.length; i++) {
        if (serverInfo[i].serverName === serverName) resolve(serverInfo[i]);
        break;
      }
    })
  }
}
