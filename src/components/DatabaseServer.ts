import {Sequelize} from '@sequelize/core';
import Logger from '../helpers/Logger.js';
import TSClient from '../helpers/TSClient.js';

const postgresUri = (await TSClient()).postgres_uri;
export default class DatabaseServer {
  private static logPrefix:string = 'Database';
  public static seq:Sequelize = new Sequelize(postgresUri, {dialect: 'postgres', logging: false, ssl: false, pool: {max: 10, min: 0, acquire: 15000, idle: 8000}});
  public static async query(pattern:string) {
    return await this.seq.query(pattern);
  }
  public static async init() {
    try {
      await this.seq.authenticate();
      this.healthCheck();
    } catch {
      Logger.console('error', this.logPrefix, 'Cannot initialize Sequelize -- is PostgreSQL running?');
      process.exit(1);
    }
  }
  private static async healthCheck() {
    try {
      await this.seq.query('SELECT 1');
      Logger.console('log', this.logPrefix, 'Connection to PostgreSQL has been established');
    } catch {
      Logger.console('error', this.logPrefix, 'Connection to PostgreSQL has been lost');
    }
  }
}
