import {token_toast} from './tokens.json';
import {ShardingManager} from 'discord.js';
const sharder = new ShardingManager('src/index.ts',{token: token_toast, totalShards: 1, mode: 'worker'});
sharder.on('shardCreate',async(shard)=>{console.log(`Shard ${shard.id} launched`)});
sharder.spawn();