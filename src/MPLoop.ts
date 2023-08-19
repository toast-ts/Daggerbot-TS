import Discord from 'discord.js';
import TClient from './client';
import {writeFileSync, readFileSync} from 'node:fs';
import {FSPlayer, FSData, FSCareerSavegame, TServer} from './typings/interfaces';

export default async(client:TClient, Channel:string, Message:string, Server:TServer, ServerName:string)=>{
  let MPLoopPrefix = '[MPLoop] ';
  let placeholder = '$_SERVERNAMEPLACEHOLDER';
  //let httpRegex = /^(https?)(\:\/\/)/;
  //let isServerOnline = false;
  let playerData:Array<string> = [];
  let noContentImage = 'https://cdn.discordapp.com/attachments/1118960531135541318/1140906691236479036/68efx1.png';
  const msg = await (client.channels.resolve(Channel) as Discord.TextChannel).messages.fetch(Message);
  const serverErrorEmbed = new client.embed().setColor(client.config.embedColorRed).setTitle('Host did not respond back in time');
  const genericEmbed = new client.embed();

  // Log bot uptime for the sake of debugging.
  (client.channels.resolve('1091300529696673792') as Discord.TextChannel).send(client.formatTime(client.uptime, 2, {longNames: true, commas: true}));

  const decoPlayer = (player:FSPlayer)=>{
    let decorator = player.isAdmin ? ':detective:' : '';
    decorator += player.name.includes('Toast') ? '<:toastv2:1132681026662056079>' : '';
    return decorator
  }
  
  const HITALL = async()=>{
    let sessionInit = {signal: AbortSignal.timeout(7500),headers:{'User-Agent':`Daggerbot - HITALL/fetch`}};
    try {
      const hitDSS = await fetch(Server.ip+'/feed/dedicated-server-stats.json?code='+Server.code, sessionInit).then(r=>r.json() as Promise<FSData>);
      const hitCSG = await fetch(Server.ip+'/feed/dedicated-server-savegame.html?code='+Server.code+'&file=careerSavegame', sessionInit).then(async r=>(client.xjs.xml2js(await r.text(), {compact: true}) as any).careerSavegame as FSCareerSavegame);

      if (!hitDSS ?? !hitCSG){
        if (hitDSS && !hitDSS.slots) return new Error(`${MPLoopPrefix}DSS failed with unknown slots table for ${ServerName}`);
        if (hitDSS && !hitCSG) return msg.edit({content: 'No savegame found or autosave has ran.', embeds: [genericEmbed.setColor(client.config.embedColorOrange).setImage(noContentImage)]});
        else return msg.edit({embeds: [serverErrorEmbed]});
      }

      //Timescale formatting
      function formatTimescale(number:number,digits:number,icon:string){
        var n = Number(number);
        return n.toLocaleString(undefined, {minimumFractionDigits: digits})+icon
      }

      // Join/Leave log
      function playerLogEmbed(player:FSPlayer,joinLog:boolean){
        const logEmbed = new client.embed().setDescription(`**${player.name}${decoPlayer(player)}** ${joinLog ? 'joined' : 'left'} **${placeholder}** at <t:${Math.round(Date.now()/1000)}:t>`);
        if (joinLog) return logEmbed.setColor(client.config.embedColorGreen);
        else if (player.uptime > 0) return logEmbed.setColor(client.config.embedColorRed).setFooter({text:`Farmed for ${client.formatPlayerUptime(player.uptime)}`});
        else return logEmbed.setColor(client.config.embedColorRed);
      }

      function playerLog(){
        // Player leaving
        playersInCache.filter(x=>!playersOnServer.some(y=>y.name === x.name)).forEach(player=>serverLog.send({embeds:[playerLogEmbed(player,false)]}));
        // Player joining
        let playerObject;
        if (playersInCache.length === 0 && client.uptime > 32010) playerObject = playersOnServer;
        else if (playersInCache.length !== 0) playerObject = playersOnServer.filter(x=>!playersInCache.some(y=>y.name === x.name));
        if (playerObject) playerObject.forEach(x=>serverLog.send({embeds:[playerLogEmbed(x,true)]}));

        if (client.uptime > 32000){
          const Database:Array<number> = JSON.parse(readFileSync(`src/database/${ServerName}PlayerData.json`,{encoding:'utf8',flag:'r+'}));
          Database.push(hitDSS.slots?.used);
          writeFileSync(`src/database/${ServerName}PlayerData.json`, JSON.stringify(Database));
        }
      }

      //const serverIndicatorEmbed =(indicator:string)=>new client.embed().setTitle(`**${placeholder}** is now ${indicator}`).setColor(client.config.embedColorOrange).setTimestamp();
      const serverLog = client.channels.resolve(client.config.mainServer.channels.fs_server_log) as Discord.TextChannel;
      const playersOnServer = hitDSS.slots?.players.filter(x=>x.isUsed);
      const playersInCache = client.MPServerCache[ServerName].players;
      if (!playersOnServer ?? playersOnServer === undefined) return new Error('[MPLoop] Empty array, ignoring...'); // For the love of god, stop throwing errors everytime.
      playersOnServer.forEach(player=>playerData.push(`**${player.name}${decoPlayer(player)}**\nFarming for ${client.formatPlayerUptime(player.uptime)}`));

      ServerName = client.MPServerCache[ServerName].name; // Truncate unnecessary parts of the name for the serverLog embed
      if (hitDSS.server.name === 'Official Daggerwin Game Server') client.MPServerCache['mainServer'].name = 'Daggerwin';
      if (hitDSS.server.name === '! ! IRTGaming | Toast Test') client.MPServerCache['secondServer'].name = 'Toast';
      //Second server name is unknown, will come back and update this later.
      playerLog();
      if (hitDSS.server.name.length < 1){
        msg.edit({content: 'This embed will resume when server is back online.', embeds: [genericEmbed.setColor(client.config.embedColorRed).setTitle('The server seems to be offline.')]});
        /* if (client.MPServerCache[ServerName].status === 'online') serverLog.send({embeds:[serverIndicatorEmbed('offline')]});
        client.MPServerCache[ServerName].status = 'offline' */
      } else {
        /* if (client.MPServerCache[ServerName]?.status === 'offline' ?? null){
          serverLog.send({embeds:[serverIndicatorEmbed('online')]});
          isServerOnline = true
        }
        client.MPServerCache[ServerName].status = 'online'; */

        const serverDetails = new client.embed().setColor(client.config.embedColor).setTitle('Server details').setFields(
          {name: 'Current map', value: hitDSS.server.mapName, inline: true},
          {name: 'Server version', value: hitDSS.server.version, inline: true},
          {name: 'In-game Time', value: `${('0'+Math.floor((hitDSS.server.dayTime/3600/1000))).slice(-2)}:${('0'+Math.floor((hitDSS.server.dayTime/60/1000)%60)).slice(-2)}`, inline: true},
          {name: 'Slot Usage', value: isNaN(Number(hitCSG.slotSystem?._attributes.slotUsage)) === true ? 'Unavailable' : Number(hitCSG.slotSystem?._attributes.slotUsage).toLocaleString('en-us'), inline: true},
          {name: 'Autosave Interval', value: isNaN(Number(hitCSG.settings?.autoSaveInterval._text)) === true ? 'Unavailable' : Number(hitCSG.settings?.autoSaveInterval._text).toFixed(0)+' mins', inline:true},
          {name: 'Timescale', value: isNaN(Number(hitCSG.settings?.timeScale._text)) === true ? 'Unavailable' : formatTimescale(Number(hitCSG.settings?.timeScale._text), 0, 'x'), inline: true}
        );
        const playersEmbed = new client.embed().setColor(client.config.embedColor).setTitle(hitDSS.server.name).setDescription(hitDSS.slots.used < 1 ? '*No players online*' : playerData.join('\n\n')).setAuthor({name:`${hitDSS.slots.used}/${hitDSS.slots.capacity}`});
        msg.edit({content:'This embed updates every 30 seconds.',embeds:[serverDetails, playersEmbed]});
      }
    } catch(err) {
      msg.edit({content: null, embeds: [new client.embed().setColor(client.config.embedColorRed).setTitle('Host did not respond back in time')]});
      console.log(err)
      //throw new Error(`Failed to make a request for ${ServerName}`, {cause: err.cause})
    }
  }
  HITALL();
// Hit dem servers in the head every 30 seconds.
}
