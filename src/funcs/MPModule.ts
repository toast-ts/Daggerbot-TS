interface TServer {
  ip: string
  code: string
}
import Discord from 'discord.js';
import TClient from '../client.js';
import FormatPlayer from '../helpers/FormatPlayer.js';
import Logger from '../helpers/Logger.js';
import HookMgr from './HookManager.js';
import {writeFileSync, readFileSync} from 'node:fs';
import {FSPlayer, FSData, FSCareerSavegame} from '../typings/interfaces';

export default async(client:TClient, Channel:string, Message:string, Server:TServer, ServerName:string)=>{
  let playerData:Array<string> = [];
  let dataUnavailable = 'Unavailable'
  const msg = await (client.channels.resolve(Channel) as Discord.TextChannel).messages.fetch(Message);
  const serverErrorEmbed = new client.embed().setColor(client.config.embedColorRed).setTitle('Host did not respond back in time');
  const genericEmbed = new client.embed();
  const refreshIntervalText = 'Refreshes every 35 seconds.';
  let sessionInit = {signal: AbortSignal.timeout(8500),headers:{'User-Agent':'Daggerbot - HITALL/undici'}};
  
  try {
    const hitDSS = await fetch(Server.ip+'/feed/dedicated-server-stats.json?code='+Server.code, sessionInit).then(r=>r.json() as Promise<FSData>);
    const hitCSG = await fetch(Server.ip+'/feed/dedicated-server-savegame.html?code='+Server.code+'&file=careerSavegame', sessionInit).then(async r=>(new client.fxp.XMLParser({ignoreAttributes: false, transformAttributeName(attributeName){return attributeName.replaceAll('@_','')}}).parse(await r.text()) as any).careerSavegame as FSCareerSavegame);

    if (!hitDSS ?? !hitCSG){
      if (hitDSS && !hitDSS.slots) return Logger.forwardToConsole('log', 'MPModule', `DSS failed with unknown slots table for ${client.MPServerCache[ServerName].name}`);
      else return msg.edit({embeds: [serverErrorEmbed]});
    }

    // Truncate unnecessary parts of the name for the MPServerCache
    // This is a mess, but it works.
    for (const filter of ['Official Daggerwin Game Server', 'Daggerwin Multifarm']) {
      if (hitDSS.server?.name === undefined) return;
      if (hitDSS.server?.name.includes(filter)) client.MPServerCache[ServerName].name = ['Daggerwin', 'DagMF'][['Official Daggerwin Game Server', 'Daggerwin Multifarm'].indexOf(filter)];
    }

    //Timescale formatting
    function formatTimescale(number:number,digits:number,icon:string){
      var n = Number(number);
      return n.toLocaleString(undefined, {minimumFractionDigits: digits})+icon
    }

    // Join/Leave log
    function playerLogEmbed(player:FSPlayer,joinLog:boolean){
      const logEmbed = new client.embed().setDescription(`**${player.name}${FormatPlayer.decoratePlayerIcons(player)}** ${joinLog ? 'joined' : 'left'} **${client.MPServerCache[ServerName].name}** at <t:${Math.round(Date.now()/1000)}:t>`);
      if (joinLog) return logEmbed.setColor(client.config.embedColorGreen);
      else if (player.uptime > 0) return logEmbed.setColor(client.config.embedColorRed).setFooter({text:`Farmed for ${FormatPlayer.uptimeFormat(player.uptime)}`});
      else return logEmbed.setColor(client.config.embedColorRed);
    }

    const serverLog = client.channels.resolve(client.config.mainServer.channels.fs_server_log) as Discord.TextChannel;
    const playersOnServer = hitDSS.slots?.players.filter(x=>x.isUsed);
    const playersInCache = client.MPServerCache[ServerName].players;
    if (!playersOnServer ?? playersOnServer === undefined) return Logger.forwardToConsole('log', 'MPModule', 'Array is empty, ignoring...'); // For the love of god, stop throwing errors everytime.
    playersOnServer.forEach(player=>playerData.push(`**${player.name}${FormatPlayer.decoratePlayerIcons(player)}**\nFarming for ${FormatPlayer.uptimeFormat(player.uptime)}`));

    // Player leaving
    for (const player of playersInCache.filter(x=>!playersOnServer.some(y=>y.name === x.name))){
      if (player.uptime > 0) serverLog.send({embeds:[playerLogEmbed(player,false)]});
    } // Player joining
    let playerObject;
    if (!playersInCache.length && client.uptime > 32010) playerObject = playersOnServer;
    if (playerObject) for (const player of playerObject) serverLog.send({embeds:[playerLogEmbed(player,true)]});
    else if (playersInCache.length) playerObject = playersOnServer.filter(x=>!playersInCache.some(y=>y.name === x.name));

    if (client.MPServerCache[ServerName].name === null) return;
    const Database:Array<number> = JSON.parse(readFileSync(`src/database/${client.MPServerCache[ServerName].name}PlayerData.json`,{encoding:'utf8',flag:'r+'}));
    Database.push(hitDSS.slots?.used);
    writeFileSync(`src/database/${client.MPServerCache[ServerName].name}PlayerData.json`, JSON.stringify(Database));
    client.MPServerCache[ServerName].players = playersOnServer;

    if (hitDSS.server.name.length < 1) {
      msg.edit({content: 'This embed will resume when server is back online.', embeds: [genericEmbed.setColor(client.config.embedColorRed).setTitle('The server seems to be offline.')]});
      client.MPServerCache[ServerName].status = 'offline'
    } else {
      client.MPServerCache[ServerName].status = 'online';
      const serverDetails = new client.embed().setColor(client.config.embedColor).setTitle('Server details').setFields(
        {name: 'Current map', value: hitDSS.server.mapName, inline: true},
        {name: 'Server version', value: hitDSS.server.version, inline: true},
        {name: 'In-game Time', value: `${('0'+Math.floor((hitDSS.server.dayTime/3600/1000))).slice(-2)}:${('0'+Math.floor((hitDSS.server.dayTime/60/1000)%60)).slice(-2)}`, inline: true},
        {name: 'Slot Usage', value: isNaN(Number(hitCSG?.slotSystem?.slotUsage)) === true ? dataUnavailable : Number(hitCSG.slotSystem?.slotUsage).toLocaleString('en-us'), inline: true},
        {name: 'Autosave Interval', value: isNaN(Number(hitCSG?.settings?.autoSaveInterval)) === true ? dataUnavailable : Number(hitCSG.settings?.autoSaveInterval).toFixed(0)+' mins', inline:true},
        {name: 'Timescale', value: isNaN(Number(hitCSG?.settings?.timeScale)) === true ? dataUnavailable : formatTimescale(Number(hitCSG.settings?.timeScale), 0, 'x'), inline: true}
      );
      const playersEmbed = new client.embed().setColor(client.config.embedColor).setTitle(hitDSS.server.name).setDescription(hitDSS.slots.used < 1 ? '*No players online*' : playerData.join('\n\n')).setAuthor({name:`${hitDSS.slots.used}/${hitDSS.slots.capacity}`});
      msg.edit({content:refreshIntervalText,embeds:[serverDetails, playersEmbed]});
    }

    // #multifarm_chat webhook
    const growthModeTextMap = {
      '1': 'Yes',
      '2': 'No',
      '3': 'Growth paused'
    }
    const growthModeText = growthModeTextMap[hitCSG?.settings.growthMode] ?? dataUnavailable;

    function genericMapping<T>(map: Record<string, T>, key: string, defaultValue: T): T {
      return map[key] ?? defaultValue;
    }
    const genericTextMap = {
      'false': 'Off',
      'true': 'On'
    }

    const fuelUsageTextMap = {
      '1': 'Low',
      '2': 'Normal',
      '3': 'High'
    }
    const fuelUsageText = fuelUsageTextMap[hitCSG?.settings.fuelUsage] ?? dataUnavailable;

    const dirtIntervalTextMap = {
      '1': 'Off',
      '2': 'Slow',
      '3': 'Normal',
      '4': 'Fast'
    }
    const dirtIntervalText = dirtIntervalTextMap[hitCSG?.settings.dirtInterval] ?? dataUnavailable;
    // Edit the embed in #multifarm_chat
    HookMgr.edit(client, 'mf_chat', '1159998634604109897', '1160098458997370941', {
      content: refreshIntervalText,
      embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Savegame Settings').addFields(
          {name: 'Seasonal Growth', value: growthModeText, inline: true},
          {name: 'Crop Destruction', value: genericMapping(genericTextMap, hitCSG?.settings.fruitDestruction, dataUnavailable), inline: true},
          {name: 'Periodic Plowing', value: genericMapping(genericTextMap, hitCSG?.settings.plowingRequiredEnabled, dataUnavailable), inline: true},
          {name: 'Stones', value: genericMapping(genericTextMap, hitCSG?.settings.stonesEnabled, dataUnavailable), inline: true},
          {name: 'Lime', value: genericMapping(genericTextMap, hitCSG?.settings.limeRequired, dataUnavailable), inline: true},
          {name: 'Weeds', value: genericMapping(genericTextMap, hitCSG?.settings.weedsEnabled, dataUnavailable), inline: true},
          {name: 'Fuel Usage', value: fuelUsageText, inline: true},
          {name: 'Dirt Interval', value: dirtIntervalText, inline: true},
        ).setFooter({text: 'Last updated'}).setTimestamp()]
    });
  } catch(err) {
    msg.edit({content: err.message, embeds: [serverErrorEmbed]});
    Logger.forwardToConsole('log', 'MPModule', `Failed to make a request for ${ServerName}: ${err.message}`);
  }
}
