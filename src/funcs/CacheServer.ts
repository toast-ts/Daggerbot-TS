import {createClient, ErrorReply} from 'redis';
import Logger from '../helpers/Logger.js';
import {readFileSync} from 'node:fs';
import {Tokens} from '../typings/interfaces';
const tokens:Tokens = JSON.parse(readFileSync('src/tokens.json', 'utf-8'));

let Prefix = 'Cache';
const RedisClient = createClient({
  url: tokens.redis_uri,
  database: 0,
  name: 'Daggerbot',
  socket: {
    keepAlive: 15000,
    timeout: 30000
  }
});

export default class CacheServer {
  protected static eventManager() {
    RedisClient
      .on('connect', ()=>Logger.forwardToConsole('log', Prefix, 'Connection to Redis has been established'))
      .on('error', (err:ErrorReply)=>Logger.forwardToConsole('error', Prefix, `Encountered an error in Redis: ${err.message}`))
    }
  protected static async connect() {
    await RedisClient.connect();
  }
  static async get(key:any) {
    const cachedResult = await RedisClient.get(key);
    if (cachedResult) return JSON.parse(cachedResult);
    else return null
  }
  static async set(key:any, value:any) {
    Logger.forwardToConsole('log', Prefix, `Building cache for ${key}`);
    return await RedisClient.set(key, JSON.stringify(value));
  }
  static async expiry(key:any, time:number) {
    Logger.forwardToConsole('log', Prefix, `Setting expiration for ${key} to ${time} seconds`);
    return await RedisClient.expire(key, time);
  }
  static async delete(key:any) {
    Logger.forwardToConsole('log', Prefix, `Deleting cache for ${key}`);
    return await RedisClient.del(key);
  }
  static init() {
    this.connect();    
    this.eventManager();
  }
}
