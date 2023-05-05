import Discord from 'discord.js';
import TClient from './client';
import fs from 'node:fs';
import {FSData, FSCareerSavegame} from './typings/interfaces';

export default async(client:TClient,Channel:string,Message:string)=>{
  if (!client.config.botSwitches.mpstats) return;
  const msg = await (client.channels.resolve(Channel) as Discord.TextChannel).messages.fetch(Message);
  const embed = new client.embed();
  let Players = [];
  let error:Boolean;

  const Server = await client.MPServer._content.findById(client.config.mainServer.id);
  const FS_IP = Server.ip;
  const FS_Code = Server.code;
  const verifyUrl = FS_IP.match(/http|https/);
  const DSSUrl = FS_IP+'/feed/dedicated-server-stats.json?code='+FS_Code;
  const CSGUrl = FS_IP+'/feed/dedicated-server-savegame.html?code='+FS_Code+'&file=careerSavegame';

  const DSS = {
    data: {} as FSData, fetchResult: '' as string
  };
  const CSG = {
    data: {} as FSCareerSavegame, fetchResult: '' as string
  };

  if (!verifyUrl) return msg.edit({content: '*Detected an invalid IP\nContact MP Manager or Bot Tech*', embeds: null});
  async function serverData(client:TClient, URL:string){
    return await client.axios.get(URL, {timeout: 5000, maxContentLength: Infinity, headers:{'User-Agent':`Daggerbot/axios ${client.axios.VERSION}`}}).catch((error:Error)=>error.message)
  }
  await Promise.all([serverData(client, DSSUrl), serverData(client, CSGUrl)]).then(function(results){
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
    console.error(client.logTime(), DSS.fetchResult);
  } else if (CSG.fetchResult.length != 0){
    error = true;
    console.error(client.logTime(), CSG.fetchResult);
  }
  if (error){ // Blame Nawdic
    embed.setTitle('Host is not responding').setColor(client.config.embedColorRed);
    msg.edit({content:null, embeds: [embed]})
    return;
  }

  const Database = JSON.parse(fs.readFileSync('src/database/MPPlayerData.json',{encoding:'utf8',flag:'r+'}));
  Database.push(DSS.data.slots?.used);
  fs.writeFileSync('src/database/MPPlayerData.json', JSON.stringify(Database));

  //Timescale formatting
  function formatTimescale(number:number,digits:number,icon:string){
    var n = Number(number);
    return n.toLocaleString(undefined, {minimumFractionDigits: digits})+icon
  }
  
  if (DSS.data.server.name.length === 0){
    embed.setTitle('The server seems to be offline.').setColor(client.config.embedColorRed);
    msg.edit({content: 'This embed will resume when the server is back online.', embeds: [embed]})
  } else {
    const statusEmbed = new client.embed().setColor(client.config.embedColor).setTitle('Server details').setFields(
      {name: 'Current Map', value: `${DSS.data.server.mapName.length === 0 ? '\u200b' : DSS.data.server.mapName}`, inline: true},
      {name: 'Version', value: `${DSS.data.server.version.length === 0 ? '\u200b' : DSS.data.server.version}`, inline: true},
      {name: 'In-game Time', value: `${('0'+Math.floor((DSS.data.server.dayTime/3600/1000))).slice(-2)}:${('0'+Math.floor((DSS.data.server.dayTime/60/1000)%60)).slice(-2)}`, inline: true},
      {name: 'Slot Usage', value: `${isNaN(Number(CSG.data.slotSystem?._attributes.slotUsage)) === true ? 'Unavailable' : Number(CSG.data.slotSystem?._attributes.slotUsage).toLocaleString('en-us')}`, inline: true},
      {name: 'Timescale', value: `${isNaN(Number(CSG.data.settings?.timeScale._text)) === true ? 'Unavailable' : formatTimescale(Number(CSG.data.settings?.timeScale._text), 0, 'x')}`, inline: true}
    );
    DSS.data.slots.players.filter(x=>x.isUsed !== false).forEach(player=>Players.push(`**${player.name} ${player.isAdmin ? '| admin' : ''}**\nFarming for ${(Math.floor(player.uptime/60))} hr & ${(''+(player.uptime%60)).slice(-2)} min`));
    embed.setColor(client.config.embedColor).setTitle(DSS.data.server.name).setDescription(`${DSS.data.slots.used === 0 ? '*No players online*' : Players.join('\n\n')}`).setAuthor({name:`${DSS.data.slots.used}/${DSS.data.slots.capacity}`});
    msg.edit({content:'This embed updates every minute.',embeds:[statusEmbed,embed]})
  }
}
