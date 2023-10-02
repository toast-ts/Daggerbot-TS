import mongoose from 'mongoose';
import Logger from '../helpers/Logger.js';
import {readFileSync} from 'node:fs';
import {Tokens} from '../typings/interfaces';
const tokens:Tokens = JSON.parse(readFileSync('src/tokens.json', 'utf-8'));

const connection:mongoose.Connection = mongoose.connection;
export default class DatabaseServer {
  protected static eventManager() {
    let dbPrefix = 'Database';
    connection
      .on('connected', ()=>Logger.forwardToConsole('log', dbPrefix, 'Connection to MongoDB has been established'))
      .on('disconnected', ()=>Logger.forwardToConsole('log', dbPrefix, 'Connection to MongoDB has been lost'))
      .on('close', ()=>Logger.forwardToConsole('log', dbPrefix, 'MongoDB has closed the connection'))
      .on('all', ()=>Logger.forwardToConsole('log', dbPrefix, 'Successfully established a connection to all members'))
      .on('fullsetup', ()=>Logger.forwardToConsole('log', dbPrefix, 'Successfully established a connection to Primary server & atleast one member'))
      .on('error', (err:mongoose.Error)=>Logger.forwardToConsole('error', dbPrefix, `Encountered an error in MongoDB: ${err.message}`))
  }
  protected static connect() {
    connection.set('strictQuery', true);
    connection.openUri(tokens.mongodb_uri, {
      replicaSet: 'toastyy',
      autoIndex: true,
      authMechanism: 'SCRAM-SHA-256',
      authSource: 'admin',
      serverSelectionTimeoutMS: 15000,
      waitQueueTimeoutMS: 50000,
      socketTimeoutMS: 30000,
      tls: false,
      family: 4
    })
  }
  static init() {
    this.connect();    
    this.eventManager();
  }
}
