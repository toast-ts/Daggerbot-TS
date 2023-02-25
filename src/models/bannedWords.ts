import Discord from 'discord.js';
import TClient from 'src/client';
import mongoose from 'mongoose';

const Schema = mongoose.model('bannedWords', new mongoose.Schema({
  _id: {type: String, required:true}
}));

export default class bannedWords extends Schema {
  client: TClient;
  _content: typeof Schema;
  constructor(client:TClient){
    super();
    this.client = client;
    this._content = Schema;
  }
}
