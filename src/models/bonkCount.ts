import TClient from 'src/client';
import mongoose from 'mongoose';

const Schema = mongoose.model('bonkCount', new mongoose.Schema({
  _id: {type: String, required:true},
  value: {type: Number, required:true}
}, {versionKey: false}));

export default class bonkCount extends Schema {
  client: TClient;
  _content: typeof Schema;
  constructor(client:TClient){
    super();
    this.client = client;
    this._content = Schema;
  }
  async _incrementUser(userid: string){
    const amount = await this._content.findById(userid)
    if (amount) await this._content.findByIdAndUpdate(userid, {value: amount.value + 1})
    else await this._content.create({_id: userid, value: 1})
    return this;
  }
}
