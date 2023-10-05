import {createClient, ErrorReply} from 'redis';
import Logger from '../helpers/Logger.js';
import TSClient from '../helpers/TSClient.js';

let Prefix = 'Cache';
const RedisClient = createClient({
  url: (await TSClient.Token()).redis_uri,
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
      .on('error', (err:ErrorReply)=>{
        Logger.forwardToConsole('error', Prefix, `Encountered an error in Redis: ${err.message}`)
        setTimeout(async()=>{
          if (!RedisClient.isReady) {
            Logger.forwardToConsole('log', Prefix, 'Client is zombified, starting a fresh connection...');
            RedisClient.quit();
            await RedisClient.connect();
          }
        }, 1500)
      })
  }
  static async get(key:any) {
    const cachedResult = await RedisClient.get(key);
    if (cachedResult) return JSON.parse(cachedResult);
    else return null
  }
  static async set(key:any, value:any) {
    return await RedisClient.set(key, JSON.stringify(value));
  }
  static async expiry(key:any, time:number) {
    return await RedisClient.expire(key, time); // NOTE: time is in seconds, not milliseconds -- you know what you did wrong
  }
  static async delete(key:any) {
    return await RedisClient.del(key);
  }
  static init() {
    RedisClient.connect();
    this.eventManager();
  }
}
