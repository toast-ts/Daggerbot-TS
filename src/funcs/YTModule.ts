import {TextChannel} from 'discord.js';
import TClient from '../client.js';
import TSClient from '../helpers/TSClient.js';
import Logger from '../helpers/Logger.js';
import CacheServer from './CacheServer.js';
import MessageTool from '../helpers/MessageTool.js';

export default async(client:TClient, YTChannelID:string, YTChannelName:string, DiscordChannelID:string, DiscordRoleID:string)=>{
  let Data: any;
  let cacheExpiry: number = 7200; // Invalidate cache after sitting in Redis for 2 hours
  try {
    await fetch(`https://youtube.googleapis.com/youtube/v3/activities?part=snippet&channelId=${YTChannelID}&maxResults=2&key=${(await TSClient.Token()).youtube}`, {
      signal: AbortSignal.timeout(10000),
      headers: {'User-Agent':'Daggerbot - Notification/undici'},
    }).then(async json=>Data = await json.json());
  } catch (err) {
    Logger.forwardToConsole('log', 'YTModule', `Failed to fetch "${YTChannelName}" from YouTube`);
  }
  if (!Data) return;
  const getVideoId = (index:number)=>Data.items[index].snippet.thumbnails.default.url.split('/')[4];
  const videoUrl = `https://www.youtube.com/watch?v=${getVideoId(0)}`;
  const cacheKey = `YTCache:${YTChannelID}`;
  const cachedVideoId = await CacheServer.get(cacheKey);
  if (!cachedVideoId) {
    await CacheServer.set(cacheKey, getVideoId(0)).then(async()=>await CacheServer.expiry(cacheKey, cacheExpiry));
    return;
  }
  if (getVideoId(1) === cachedVideoId) {
    await CacheServer.delete(cacheKey).then(async()=>{
      await CacheServer.set(cacheKey, getVideoId(0)).then(async()=>await CacheServer.expiry(cacheKey, cacheExpiry))
    });

    (client.channels.resolve(DiscordChannelID) as TextChannel).send({
      content: `${MessageTool.formatMention(DiscordRoleID, 'role')}\n**${YTChannelName}** just uploaded a video!\n${videoUrl}`,
      allowedMentions: {parse:['roles']},
    });
  }
}
