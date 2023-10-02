import TClient from '../client.js';
import mongoose from 'mongoose';
import CacheServer from '../funcs/CacheServer.js';

const Schema = mongoose.model('mpserver', new mongoose.Schema({
  _id: {type: String, required:true},
  mainServer: {required:true, type: new mongoose.Schema({
    ip: {type: String, required:true},
    code: {type: String, required:true}
  }, {versionKey: false})},
  secondServer: {required:true, type: new mongoose.Schema({
    ip: {type: String, required:true},
    code: {type: String, required:true}
  }, {versionKey: false})},
}, {versionKey: false}));

export default class MPServer extends Schema {
  client: TClient;
  _content: typeof Schema;
  constructor(client:TClient){
    super();
    this.client = client;
    this._content = Schema;
  }
  async findInCache(query:any): Promise<any> {
    const cacheKey = `MPServer:${query}`;
    const cachedResult = await CacheServer.get(cacheKey);
    let result;
    if (cachedResult) {
      try {
        result = cachedResult;
      } catch (error) {
        console.error('Error parsing cached result:', error);
        result = await this._content.findById(query);
        CacheServer.set(cacheKey, result);
        CacheServer.expiry(cacheKey, 1800);
      }
    } else {
      result = await this._content.findById(query);
      CacheServer.set(cacheKey, result);
      CacheServer.expiry(cacheKey, 1800);
    }
    return result;
  }
}
