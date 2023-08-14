import TClient from '../client.js';
import mongoose from 'mongoose';

const Schema = mongoose.model('tags', new mongoose.Schema({
  _id: {type: String, required:true},
  message: {type: String, required:true},
  embedBool: {type: Boolean, required:true},
  user: {required:true, type: new mongoose.Schema({
    name: {type: String, required:true},
    _id: {type: String, required:true}
  }, {versionKey: false})}
}, {versionKey: false}));

export default class tags extends Schema {
  client: TClient;
  _content: typeof Schema;
  constructor(client:TClient){
    super();
    this.client = client;
    this._content = Schema;
  }
}
