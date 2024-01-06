import {createClient, ErrorReply} from 'redis';
import Logger from '../helpers/Logger.js';
import TSClient from '../helpers/TSClient.js';

const RedisClient = createClient({
  url: (await TSClient()).redis_uri,
  database: 0,
  name: 'Daggerbot',
  socket: { keepAlive: 15000, timeout: 30000, reconnectStrategy(retries:number = 5) {return Math.min(retries * 76, 1000)} }
});

export default class CacheServer {
  protected static prefix = 'Cache';
  protected static eventManager() {
    RedisClient
      .on('connect', ()=>Logger.console('log', this.prefix, 'Connection to Redis has been established'))
      .on('error', (err:ErrorReply)=>Logger.console('error', this.prefix, `Encountered an error in Redis: ${err.message}`))
  }
  public static async get(key:any, jsonMode:boolean):Promise<any> {
    let cachedResult:any;
    if (jsonMode) cachedResult = await RedisClient.json.get(key);
    else {
      cachedResult = await RedisClient.get(key);
      if (cachedResult) cachedResult = JSON.parse(cachedResult);
    }
    return cachedResult;
  }
  public static async set(key:any, value:any, jsonMode:boolean):Promise<any> {
    if (jsonMode) return await RedisClient.json.set(key, '.', value);
    else return await RedisClient.set(key, JSON.stringify(value));
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
      console.error('Cannot initialize RedisClient -- is Redis running?');
      process.exit(1);
    }
  }
}
