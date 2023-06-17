import Discord from 'discord.js';
import TClient from './client';
import {writeFileSync, readFileSync} from 'node:fs';
import {FSPlayer, FSData, FSCareerSavegame} from './typings/interfaces';

export default async(client:TClient,Channel:string,Message:string,ServerName:string)=>{
  if (!client.config.botSwitches.mpstats) return;
  const msg = await (client.channels.resolve(Channel) as Discord.TextChannel).messages.fetch(Message);
  const embed = new client.embed();
  let playerData:Array<string> = [];
  let error:Boolean;
  let isServerOnline = false;
  const Server = await client.MPServer._content.findById(client.config.mainServer.id);

  const DSS = {
    data: {} as FSData, fetchResult: '' as string
  };
  const CSG = {
    data: {} as FSCareerSavegame, fetchResult: '' as string
  };

  if (!Server?.ip?.match(/http|https/)) return msg.edit({content: '*Detected an invalid IP\nContact MP Manager or Bot Tech*', embeds: null});
  async function serverData(client:TClient, URL:string){
    return await client.axios.get(URL, {timeout: 5000, maxContentLength: Infinity, headers:{'User-Agent':`Daggerbot/axios ${client.axios.VERSION}`}}).catch((error:Error)=>error.message)
  }
  await Promise.all([serverData(client, Server.ip+'/feed/dedicated-server-stats.json?code='+Server.code), serverData(client, Server.ip+'/feed/dedicated-server-savegame.html?code='+Server.code+'&file=careerSavegame')]).then(function(results){
    if (typeof results[0] === 'string'){
      DSS.fetchResult = `DagMP DSS failed, ${results[0]}`;
      embed.addFields({name:'DSS Status',value:results[0]})
    } else if (results[0].status != 200){
      DSS.fetchResult = `DagMP DSS failed with ${results[0].status + ' ' + results[0].statusText}`;
      embed.addFields({name:'DSS Status',value:results[0].status + ' ' + results[0].statusText})
    } else DSS.data = results[0].data as FSData

    if (typeof results[1] === 'string'){
      CSG.fetchResult = `DagMP CSG failed, ${results[1]}`;
      embed.addFields({name:'CSG Status',value:results[1]})
    } else if (results[1].status != 200){
      if (results[1].status === 204) embed.setImage('https://http.cat/204');
      CSG.fetchResult = `DagMP CSG failed with ${results[1].status + ' ' + results[1].statusText}`;
      embed.addFields({name:'CSG Status',value:results[1].status + ' ' + results[1].statusText})
    } else CSG.data = (client.xjs.xml2js(results[1].data,{compact:true}) as any).careerSavegame as FSCareerSavegame
  }).catch(error=>console.error(error));

  if (DSS.fetchResult.length != 0){
    error = true;
    if (DSS.data.slots === undefined) return;
    console.log(client.logTime(), DSS.fetchResult);
  } else if (CSG.fetchResult.length != 0){
    error = true;
    console.log(client.logTime(), CSG.fetchResult);
  }
  if (error){ // Blame Nawdic
    embed.setTitle('Host is not responding').setColor(client.config.embedColorRed);
    msg.edit({content:null, embeds: [embed]})
    return;
  }

  //Timescale formatting
  function formatTimescale(number:number,digits:number,icon:string){
    var n = Number(number);
    return n.toLocaleString(undefined, {minimumFractionDigits: digits})+icon
  }
  // Join/Leave log
  function playerLogEmbed(player:FSPlayer,joinLog:boolean){
    const logEmbed = new client.embed().setDescription(`**${player.name} ${player.isAdmin ? '| admin' : ''}** ${joinLog ? 'joined' : 'left'} **${ServerName}** at <t:${Math.round(Date.now()/1000)}:t>`);
    if (joinLog) return logEmbed.setColor(client.config.embedColorGreen);
    else if (player.uptime > 0) return logEmbed.setColor(client.config.embedColorRed).setFooter({text:`Farmed for ${client.formatPlayerUptime(player.uptime)}`});
    else return logEmbed.setColor(client.config.embedColorRed);
  }
  function playerLog(){
    // Player leaving
    playersInCache.filter(x=>!playersOnServer.some(y=>y.name === x.name)).forEach(player=>serverLog.send({embeds:[playerLogEmbed(player,false)]}));
    // Player joining
    let playerObject;
    if (playersInCache.length === 0 && (client.uptime as number) > 60010) playerObject = playersOnServer;
    else if (playersInCache.length !== 0) playerObject = playersOnServer.filter(x=>!playersInCache.some(y=>y.name === x.name));
    if (playerObject) playerObject.forEach(x=>serverLog.send({embeds:[playerLogEmbed(x,true)]}));
  }

  const serverIndicatorEmbed =(indicator:string)=>new client.embed().setTitle(`**${ServerName}** is now ${indicator}`).setColor(client.config.embedColorOrange).setTimestamp();

  const serverLog = client.channels.resolve(client.config.mainServer.channels.fs_server_log) as Discord.TextChannel;
  const playersOnServer = DSS.data.slots?.players.filter(x=>x.isUsed);
  const playersInCache = client.MPServerCache.players;
  playersOnServer.forEach(player=>playerData.push(`**${player.name} ${player.isAdmin ? '| admin' : ''}**\nFarming for ${client.formatPlayerUptime(player.uptime)}`));

  ServerName = client.MPServerCache.name;
  if (DSS.data.server.name === 'Official Daggerwin Game Server') client.MPServerCache.name = 'Daggerwin';

  if (DSS.data.server.name.length === 0){
    embed.setTitle('The server seems to be offline.').setColor(client.config.embedColorRed);
    msg.edit({content: 'This embed will resume when the server is back online.', embeds: [embed]});
    if (client.MPServerCache.status === 'online') serverLog.send({embeds:[serverIndicatorEmbed('offline')]});
    client.MPServerCache.status = 'offline';
  } else {
    if (client.MPServerCache.status === 'offline'){
      serverLog.send({embeds:[serverIndicatorEmbed('online')]});
      isServerOnline = true
    };
    client.MPServerCache.status = 'online';
    const statusEmbed = new client.embed().setColor(client.config.embedColor).setTitle('Server details').setFields(
      {name: 'Current Map', value: `${DSS.data.server.mapName.length === 0 ? '\u200b' : DSS.data.server.mapName}`, inline: true},
      {name: 'Version', value: `${DSS.data.server.version.length === 0 ? '\u200b' : DSS.data.server.version}`, inline: true},
      {name: 'In-game Time', value: `${('0'+Math.floor((DSS.data.server.dayTime/3600/1000))).slice(-2)}:${('0'+Math.floor((DSS.data.server.dayTime/60/1000)%60)).slice(-2)}`, inline: true},
      {name: 'Slot Usage', value: `${isNaN(Number(CSG.data.slotSystem?._attributes.slotUsage)) === true ? 'Unavailable' : Number(CSG.data.slotSystem?._attributes.slotUsage).toLocaleString('en-us')}`, inline: true},
      {name: 'Timescale', value: `${isNaN(Number(CSG.data.settings?.timeScale._text)) === true ? 'Unavailable' : formatTimescale(Number(CSG.data.settings?.timeScale._text), 0, 'x')}`, inline: true}
    );
    embed.setColor(client.config.embedColor).setTitle(DSS.data.server.name).setDescription(`${DSS.data.slots.used === 0 ? '*No players online*' : playerData.join('\n\n')}`).setAuthor({name:`${DSS.data.slots.used}/${DSS.data.slots.capacity}`});
    msg.edit({content:'This embed updates every minute.',embeds:[statusEmbed,embed]});
  }

  if (!isServerOnline){
    playerLog();
    const Database:Array<number> = JSON.parse(readFileSync('src/database/MPPlayerData.json',{encoding:'utf8',flag:'r+'}));
    Database.push(DSS.data.slots?.used);
    writeFileSync('src/database/MPPlayerData.json', JSON.stringify(Database));
    client.MPServerCache.players = playersOnServer
  }
}
