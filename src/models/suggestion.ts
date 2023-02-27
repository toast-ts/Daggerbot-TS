import TClient from 'src/client';
import mongoose from 'mongoose';

const Schema = mongoose.model('suggestion', new mongoose.Schema({
  _id: {type: String, required:true},
  idea: {type: String, required:true},
  user: {required:true, type: new mongoose.Schema({
    tag: {type: String},
    _id: {type: String}
  }, {versionKey: false})},
  state: {type: String, required:true}
}, {versionKey: false}));

export default class suggestion extends Schema {
  client: TClient;
  _content: typeof Schema;
  constructor(client:TClient){
    super();
    this.client = client;
    this._content = Schema;
  }
}
