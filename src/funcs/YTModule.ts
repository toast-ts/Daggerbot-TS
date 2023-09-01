import {TextChannel} from 'discord.js';
import TClient from '../client.js';

export default async(client: TClient, YTChannelID: string, YTChannelName: string, DiscordChannelID: string, DiscordRoleID: string)=>{
  let Data: any;
  try {
    await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YTChannelID}`, {signal: AbortSignal.timeout(8000), headers: {'User-Agent': 'Daggerbot - Notification/undici'}}).then(async xml=>Data = client.xjs.xml2js(await xml.text(), {compact: true}))
  } catch(err){
    console.log(client.logTime(), `Failed to fetch "${YTChannelName}" from YouTube`)
  }

  if (!Data) return;
  if (!client.YTCache[YTChannelID]) return client.YTCache[YTChannelID] = Data.feed.entry[0]['yt:videoId']._text;
  if (Data.feed.entry[1]['yt:videoId']._text === client.YTCache[YTChannelID]){
    client.YTCache[YTChannelID] = Data.feed.entry[0]['yt:videoId']._text;
    (client.channels.resolve(DiscordChannelID) as TextChannel).send({content: `<@&${DiscordRoleID}> (Ping notification are currently WIP, no eta when complete, the mentioned role is a placeholder for now)\n**${YTChannelName}** just uploaded a video!\n${Data.feed.entry[0].link._attributes.href}`, allowedMentions: {parse: ['roles']}})
  }
}
