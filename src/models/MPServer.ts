import TClient from 'src/client';
import mongoose from 'mongoose';

const Schema = mongoose.model('mpserver', new mongoose.Schema({
  _id: {type: String, required:true},
  ip: {type: String},
  code: {type: String},
  timesUpdated: {type: Number, required: true}
}, {versionKey: false}));

export default class MPServer extends Schema {
  client: TClient;
  _content: typeof Schema;
  constructor(client:TClient){
    super();
    this.client = client;
    this._content = Schema;
  }
  async _increment(serverId: string){
    const server = await this._content.findById(serverId)
    if (server) await this._content.findByIdAndUpdate(server, {timesUpdated: server.timesUpdated + 1})
    else await this._content.create({_id:serverId, timesUpdated: 1})
    //console.log(`[${serverId}] :: timesUpdated value incremented`)
  }
}
