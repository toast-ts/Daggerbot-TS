import TClient from '../client.js';
import mongoose from 'mongoose';

const Schema = mongoose.model('mpserver', new mongoose.Schema({
  _id: {type: String, required:true},
  mainServer: {required:true, type: new mongoose.Schema({
    ip: {type: String, required:true},
    code: {type: String, required:true}
  }, {versionKey: false})},
  secondServer: {required:true, type: new mongoose.Schema({
    ip: {type: String, required:true},
    code: {type: String, required:true}
  }, {versionKey: false})},
}, {versionKey: false}));

export default class MPServer extends Schema {
  client: TClient;
  _content: typeof Schema;
  constructor(client:TClient){
    super();
    this.client = client;
    this._content = Schema;
  }
}
