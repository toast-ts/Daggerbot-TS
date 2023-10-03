import {TextChannel} from 'discord.js';
import TClient from '../client.js';
import Logger from '../helpers/Logger.js';
import CacheServer from './CacheServer.js';
import MessageTool from '../helpers/MessageTool.js';

export default async(client:TClient, YTChannelID:string, YTChannelName:string, DiscordChannelID:string, DiscordRoleID:string)=>{
  let Data: any;
  let cacheExpiry: number = 7200; // Invalidate cache after sitting in Redis for 2 hours
  try {
    await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YTChannelID}`, {
      signal: AbortSignal.timeout(10000),
      headers: {'User-Agent':'Daggerbot - Notification/undici'},
    }).then(async xml=>(Data = client.xjs.xml2js(await xml.text(), {compact: true})));
  } catch (err) {
    Logger.forwardToConsole('log', 'YTModule', `Failed to fetch "${YTChannelName}" from YouTube`);
  }
  if (!Data) return;
  const cacheKey = `YTCache:${YTChannelID}`;
  const cachedVideoId = await CacheServer.get(cacheKey);
  if (!cachedVideoId) {
    const videoId = Data.feed.entry[0]['yt:videoId']._text;
    await CacheServer.set(cacheKey, videoId).then(async()=>await CacheServer.expiry(cacheKey, cacheExpiry));
    return;
  }

  if (Data.feed.entry[1]['yt:videoId']._text === cachedVideoId) {
    const videoId = Data.feed.entry[0]['yt:videoId']._text;
    await CacheServer.delete(cacheKey).then(async()=>{
      await CacheServer.set(cacheKey, videoId).then(async()=>await CacheServer.expiry(cacheKey, cacheExpiry))
    });

    (client.channels.resolve(DiscordChannelID) as TextChannel).send({
      content: `${MessageTool.formatMention(DiscordRoleID, 'role')}\n**${YTChannelName}** just uploaded a video!\n${Data.feed.entry[0].link._attributes.href}`,
      allowedMentions: {parse:['roles']},
    });
  }
}
