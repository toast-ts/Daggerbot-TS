import TClient from '../client.js';
import mongoose from 'mongoose';
import CacheServer from '../funcs/CacheServer.js';

const Schema = mongoose.model('tags', new mongoose.Schema({
  _id: {type: String, required:true},
  message: {type: String, required:true},
  embedBool: {type: Boolean, required:true},
  user: {required:true, type: new mongoose.Schema({
    name: {type: String, required:true},
    _id: {type: String, required:true}
  }, {versionKey: false})}
}, {versionKey: false}));

export default class tags extends Schema {
  client: TClient;
  _content: typeof Schema;
  constructor(client:TClient){
    super();
    this.client = client;
    this._content = Schema;
  }
  async findInCache(): Promise<any> {
    const cacheKey = 'Tags';
    const cachedResult = await CacheServer.get(cacheKey);
    let result;
    if (cachedResult) {
      try {
        result = cachedResult;
      } catch (error) {
        console.error('Error parsing cached result:', error);
        result = await this._content.find();
        CacheServer.set(cacheKey, result);
        CacheServer.expiry(cacheKey, 240);
      }
    } else {
      result = await this._content.find();
      CacheServer.set(cacheKey, result);
      CacheServer.expiry(cacheKey, 240);
    }
    return result;
  }
  async updateCache(): Promise<any> {
    const cacheKey = 'Tags';
    CacheServer.delete(cacheKey);
    const result = await this._content.find();
    CacheServer.set(cacheKey, result);
    CacheServer.expiry(cacheKey, 10);
    return result;
  }
}
