import TClient from '../client';
import mongoose from 'mongoose';
import LogPrefix from '../helpers/LogPrefix.js';

const connection:mongoose.Connection = mongoose.connection;
export default class DatabaseServer {
  static connect(client: TClient) {
    const Logger = (logType:'log'|'error', msg:string)=>console[logType](client.logTime(), `${LogPrefix('DATABASE')} ${msg}`);

    connection.set('strictQuery', true);
    connection.openUri(client.tokens.mongodb_uri, {
      replicaSet: 'toastyy',
      autoIndex: true,
      authMechanism: 'SCRAM-SHA-256',
      authSource: 'admin',
      serverSelectionTimeoutMS: 15000,
      waitQueueTimeoutMS: 50000,
      socketTimeoutMS: 30000,
      tls: false,
      family: 4
    });

    connection
    .on('connecting', ()=>Logger('log','Establishing connection to MongoDB'))
    .on('connected', ()=>Logger('log','Connection to MongoDB has been established'))
    .on('disconnecting', ()=>Logger('log','Disconnecting from MongoDB'))
    .on('disconnected', ()=>Logger('log','Disconnected from MongoDB'))
    .on('close', ()=>Logger('log','MongoDB has closed the connection'))
    .on('all', ()=>Logger('log','Successfully established a connection to all members'))
    .on('fullsetup', ()=>Logger('log','Successfully established a connection to Primary server & atleast one member'))
    .on('error', (err:mongoose.Error)=>Logger('error',`Encountered an error in MongoDB: ${err.message}`));
  }
}
