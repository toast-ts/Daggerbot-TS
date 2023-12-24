import {createClient, ErrorReply} from 'redis';
import Logger from '../helpers/Logger.js';
import TSClient from '../helpers/TSClient.js';

let Prefix = 'Cache';
const RedisClient = createClient({
  url: (await TSClient()).redis_uri,
  database: 0,
  name: 'Daggerbot',
  socket: { keepAlive: 15000, timeout: 30000 }
});

export default class CacheServer {
  protected static eventManager() {
    RedisClient
      .on('connect', ()=>Logger.console('log', Prefix, 'Connection to Redis has been established'))
      .on('error', (err:ErrorReply)=>{
        Logger.console('error', Prefix, `Encountered an error in Redis: ${err.message}`)
        setTimeout(async()=>{
          if (!RedisClient.isReady) {
            Logger.console('log', Prefix, 'Client is zombified, starting a fresh connection...');
            RedisClient.quit();
            await RedisClient.connect();
          }
        }, 1500)
      })
  }
  public static async get(key:any) {
    const cachedResult = await RedisClient.get(key);
    if (cachedResult) return JSON.parse(cachedResult);
    else return null
  }
  public static async set(key:any, value:any) {
    return await RedisClient.set(key, JSON.stringify(value));
  }
  public static async getJSON(key:any) {
    const cachedResult = await RedisClient.json.get(key);
    if (cachedResult) return cachedResult;
    else return null
  }
  public static async setJSON(key:any, value:any) {
    return await RedisClient.json.set(key, '.', value);
  }
  public static async expiry(key:any, time:number) {
    return await RedisClient.expire(key, time); // NOTE: time is in seconds, not milliseconds -- you know what you did wrong
  }
  public static async delete(key:any) {
    return await RedisClient.del(key);
  }
  public static init() {
    try {
      RedisClient.connect();
      this.eventManager();
    } catch {
      console.error('Cannot initialize RedisClient -- is Redis running?')
    }
  }
}
