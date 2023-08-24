import TClient from './client';
import mongoose from 'mongoose';

export default async(client:TClient)=>{
  const LogPrefix = '[DATABASE]';
  mongoose.set('strictQuery', true);

  const connection =  mongoose.connection;
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
    .on('connecting', ()=>console.log(client.logTime(), `${LogPrefix} Establishing connection to MongoDB`))
    .on('connected', ()=>console.log(client.logTime(), `${LogPrefix} Connection to MongoDB has been established`))
    .on('disconnecting', ()=>console.log(client.logTime(), `${LogPrefix} Disconnecting from MongoDB`))
    .on('disconnected', ()=>console.log(client.logTime(), `${LogPrefix} Disconnected from MongoDB`))
    .on('close', ()=>console.log(client.logTime(), `${LogPrefix} MongoDB has closed the connection`))
    .on('reconnected', ()=>console.log(client.logTime(), `${LogPrefix} Re-establishing a connection to MongoDB`))
    .on('all', ()=>console.log(client.logTime(), `${LogPrefix} Successfully established a connection to all members`))
    .on('fullsetup', ()=>console.log(client.logTime(), `${LogPrefix} Successfully established a connection to Primary server & atleast one member`))
    .on('error', ((err:mongoose.Error)=>console.error(client.logTime(), `${LogPrefix} Encountered an error in MongoDB: ${err.message}`)));
}
