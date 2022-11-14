import {token_main} from './tokens.json'
import { ShardingManager } from "discord.js";
const sharder = new ShardingManager('./index.ts',{token: token_main, totalShards: 1, mode: 'worker'})
sharder.on('shardCreate',async(shard)=>{console.log(`Shard ${shard.id} launched`)})
sharder.spawn();