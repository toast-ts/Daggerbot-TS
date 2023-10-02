import TClient from '../client.js';
import mongoose from 'mongoose';
import CacheServer from '../funcs/CacheServer.js';

const Schema = mongoose.model('bannedWords', new mongoose.Schema({
  _id: {type: String, required:true}
}, {versionKey: false}));

export default class bannedWords extends Schema {
  client: TClient;
  _content: typeof Schema;
  constructor(client:TClient){
    super();
    this.client = client;
    this._content = Schema;
  }
  async findInCache(): Promise<any> {
    const cacheKey = 'bannedWords';
    const cachedResult = await CacheServer.get(cacheKey);
    let result;
    if (cachedResult) {
      try {
        result = cachedResult;
      } catch (error) {
        console.error('Error parsing cached result:', error);
        result = await this._content.find();
        CacheServer.set(cacheKey, result);
        CacheServer.expiry(cacheKey, 180);
      }
    } else {
      result = await this._content.find();
      CacheServer.set(cacheKey, result);
      CacheServer.expiry(cacheKey, 180);
    }
    return result;
  }
}
