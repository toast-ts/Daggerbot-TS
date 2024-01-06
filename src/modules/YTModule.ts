import {TextChannel} from 'discord.js';
import TClient from '../client.js';
import TSClient from '../helpers/TSClient.js';
import Undici from 'undici';
import Logger from '../helpers/Logger.js';
import CacheServer from '../components/CacheServer.js';
import MessageTool from '../helpers/MessageTool.js';
export default async(client:TClient)=>{
  let Data:any;
  const cacheExpiry:number = 7200; // Invalidate cache after sitting in Redis for 2 hours

  const YTDB = await client.ytChannels.getChannels();
  for (const channel of YTDB) {
    let YTChannelID:string;
    let YTChannelName:string;
    let DiscordChannelID:string;
    let DiscordRoleID:string;

    YTChannelID = channel.dataValues.ytchannel;
    DiscordChannelID = channel.dataValues.dcchannel;
    DiscordRoleID = channel.dataValues.dcrole;

    if (!YTChannelID) return;
    if (!DiscordChannelID ?? !DiscordRoleID) throw new Error('[YTModule] Discord channel/role ID is missing.');

    try {
      await Undici.request(`https://youtube.googleapis.com/youtube/v3/activities?part=snippet&channelId=${YTChannelID}&maxResults=2&key=${(await TSClient()).youtube}`, {
        signal: AbortSignal.timeout(10000),
        headers: {'User-Agent':`${client.user.username} - YTModule/undici`}
      }).then(async resp=>Data = await resp.body.json());
      YTChannelName = Data.items[0].snippet.channelTitle;
    } catch {
      Logger.console('log', 'YTModule', `Failed to get video data for "${YTChannelName}" from YouTube API`);
    }
    if (!Data) return;

    const getVideoId = (index:number)=>Data.items[index].snippet.thumbnails.default.url.split('/')[4];
    const videoUrl = `https://www.youtube.com/watch?v=${getVideoId(0)}`;
    const cacheKey = `YTModule:${YTChannelID}`;
    const cachedVideoId = await CacheServer.get(cacheKey, false);
    if (!cachedVideoId) {
      await CacheServer.set(cacheKey, getVideoId(0), false).then(async()=>await CacheServer.expiry(cacheKey, cacheExpiry));
      continue;
    }
    if (getVideoId(1) === cachedVideoId) {
      Logger.console('log', 'YTModule:DEBUG', `New video uploaded by ${YTChannelName} and notification sent to Discord`)
      await CacheServer.delete(cacheKey).then(async()=>await CacheServer.set(cacheKey, getVideoId(0), false).then(async()=>await CacheServer.expiry(cacheKey, cacheExpiry)));

      (client.channels.resolve(DiscordChannelID) as TextChannel).send({
        content: `${MessageTool.formatMention(DiscordRoleID, 'role')}\n**${YTChannelName}** just uploaded a video!\n${videoUrl}`, allowedMentions: {parse: ['roles']},
      });
    }
  }
}
