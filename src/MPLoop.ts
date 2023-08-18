import Discord from 'discord.js';
import TClient from './client';
import {writeFileSync, readFileSync} from 'node:fs';
import {FSPlayer, FSData, FSCareerSavegame} from './typings/interfaces';

export default async(client:TClient, Channel:string, Message:string, ServerName:string)=>{
  if (!client.config.botSwitches.mpstats) return;
  
  const msg = await (client.channels.resolve(Channel) as Discord.TextChannel).messages.fetch(Message);
  const database = await client.MPServer._content.findById(client.config.mainServer.id);
  const servers = {
    main: {
      dss: database.mainServer.ip+'/feed/dedicated-server-stats.json?code='+database.mainServer.code,
      csg: database.mainServer.ip+'/feed/dedicated-server-savegame.html?code='+database.mainServer.code+'&file=careerSavegame'
    },
    second: {
      dss: database.secondServer.ip+'/feed/dedicated-server-stats.json?code='+database.secondServer.code,
      csg: database.secondServer.ip+'/feed/dedicated-server-savegame.html?code='+database.secondServer.code+'&file=careerSavegame'
    }
  };
  // Log bot uptime for the sake of debugging.
  (client.channels.resolve('1091300529696673792') as Discord.TextChannel).send(client.formatTime(client.uptime, 2, {longNames: true, commas: true}));

  const HITALL = async()=>{
    /* const hitDSS = await Promise.all([
      client.axios.get(servers.main.dss,{timeout:7500,maxContentLength:Infinity,headers:{'User-Agent':`Daggerbot - HITALL/axios ${client.axios.VERSION}`}}),
      client.axios.get(servers.second.dss,{timeout:7500,maxContentLength:Infinity,headers:{'User-Agent':`Daggerbot - HITALL/axios ${client.axios.VERSION}`}})
    ]).catch(e=>{throw new Error('hitDSS failed to make a request', {cause: e.cause})}); */
    const hitCSG = await Promise.all([
      client.axios.get(servers.main.csg,{timeout:7500,maxContentLength:Infinity,headers:{'User-Agent':`Daggerbot - HITALL/axios ${client.axios.VERSION}`}}),
      client.axios.get(servers.second.csg,{timeout:7500,maxContentLength:Infinity,headers:{'User-Agent':`Daggerbot - HITALL/axios ${client.axios.VERSION}`}})
    ]).catch(e=>{throw new Error('hitCSG failed to make a request', {cause: e.cause})});
    try {
      const APIData = {
        'Daggerwin': {
          //dss: hitDSS[0].data as FSData,
          csg: (client.xjs.xml2js(hitCSG[0].data,{compact:true}) as any).careerSavegame as FSCareerSavegame
        },
        'SecondServer': {
          //dss: hitDSS[1].data as FSData,
          csg: (client.xjs.xml2js(hitCSG[1].data,{compact:true}) as any).careerSavegame as FSCareerSavegame
        }
      } as const;
      console.log(APIData['Daggerwin'].csg)
      console.log(APIData['SecondServer'].csg)
      //console.log((APIData.Daggerwin.dss as FSData).server.name)
      //console.log((APIData.Daggerwin.csg as FSCareerSavegame).statistics.money)
      msg.edit({content: [
        ServerName,
        (APIData[ServerName].csg as FSCareerSavegame).settings.savegameName._text
      ].join('\n')})
    } catch(err) {
      msg.edit({content: err.message})
      throw new Error('HITALL failed to make a promise request', {cause: err.cause});
    }
  }
  HITALL();

  /* await Promise.all([
    client.axios.get(servers.main.dss,{timeout:7500,maxContentLength:Infinity,headers:{'User-Agent':`Daggerbot/axios ${client.axios.VERSION}`}}),
    client.axios.get(servers.main.csg,{timeout:7500,maxContentLength:Infinity,headers:{'User-Agent':`Daggerbot/axios ${client.axios.VERSION}`}}),
    client.axios.get(servers.second.dss,{timeout:7500,maxContentLength:Infinity,headers:{'User-Agent':`Daggerbot/axios ${client.axios.VERSION}`}}),
    client.axios.get(servers.second.csg,{timeout:7500,maxContentLength:Infinity,headers:{'User-Agent':`Daggerbot/axios ${client.axios.VERSION}`}})
  ]).then(x=>x.map(x=>x.data)).catch(()=>{throw new Error('[MPLOOP] Failed to make a promise request.')});
  msg.edit({content: ServerName, embeds: []}) */
}

/* export default async(client:TClient,Channel:string,Message:string,ServerName:string)=>{
  if (!client.config.botSwitches.mpstats) return;
  const noContentImage = 'https://cdn.discordapp.com/attachments/1118960531135541318/1140906691236479036/68efx1.png';
  const msg = await (client.channels.resolve(Channel) as Discord.TextChannel).messages.fetch(Message);
  const embed = new client.embed();
  let playerData:Array<string> = [];
  let error:Boolean;
  let isServerOnline = false;
  const fetchServer = await client.MPServer._content.findById(client.config.mainServer.id);
  
  const API = { // Fetch needed data from Farming Simulator server's API endpoints.
    DSS: {
      data: {} as FSData,
      res: '' as string,
      endpoint: '/feed/dedicated-server-stats.json?code='
    },
    CSG: {
      data: {} as FSCareerSavegame,
      res: '' as string,
      endpoint: '/feed/dedicated-server-savegame.html?code=',
      endpoint_file: '&file=careerSavegame'
    }
  }

  // Fetch needed data from database server and hit them with a GET request.
  if (!fetchServer.mainServer.ip(/http|https/) ?? !fetchServer.secondServer.ip(/http|https/)) return msg.edit({content:'*This server doesn\'t seem to be setup yet!*', embeds:null});
  async function hitServer(client:TClient, URL:string){
    return await client.axios.get(URL, {
      timeout: 7500, // Increased the timeout a bit just in case.
      maxContentLength: Infinity,
      headers: {
        'User-Agent': `Daggerbot/axios ${client.axios.VERSION}`
      }
    }).catch((err:Error)=>err.message)
  }
  await Promise.all([
    hitServer(client, fetchServer.mainServer.ip+API.DSS.endpoint+fetchServer.mainServer.code),
    hitServer(client, fetchServer.mainServer.ip+API.CSG.endpoint+fetchServer.mainServer.code+API.CSG.endpoint_file),
    hitServer(client, fetchServer.secondServer.ip+API.DSS.endpoint+fetchServer.secondServer.code),
    hitServer(client, fetchServer.secondServer.ip+API.CSG.endpoint+fetchServer.secondServer.code+API.CSG.endpoint_file)
  ]).then(function(results){
    // Main server's DSS
    if (typeof results[0] === 'string') {
      API.DSS.res = `DagMP:Main DSS failed, ${results[0]}`;
      embed.addFields({name:'DSS Status',value:results[0]})
    } else if (results[0].status != 200) {
      API.DSS.res = `DagMP:Main DSS failed with ${results[0].status +' '+ results[0].statusText}`;
      embed.addFields({name:'DSS Status',value:results[0].status +' '+ results[0].statusText})
    } else API.DSS.data = results[0].data as FSData

    // Main server's CSG
    if (typeof results[1] === 'string') {
      API.CSG.res = `DagMP:Main CSG failed, ${results[1]}`;
      embed.addFields({name:'CSG Status',value:results[1]})
    } else if (results[1].status != 200) {
      if (results[1].status === 204) embed.setImage(noContentImage);
      API.CSG.res = `DagMP:Main CSG failed with ${results[1].status +' '+ results[1].statusText}`;
      embed.addFields({name:'CSG Status',value:results[1].status +' '+ results[1].statusText})
    } else API.CSG.data = (client.xjs.xml2js(results[1].data,{compact:true}) as any).careerSavegame as FSCareerSavegame

    // Second server's DSS
    if (typeof results[2] === 'string') {
      API.DSS.res = `DagMP:Second DSS failed, ${results[2]}`;
      embed.addFields({name:'DSS Status',value:results[2]})
    } else if (results[2].status != 200) {
      API.DSS.res = `DagMP:Second DSS failed with ${results[2].status +' '+ results[2].statusText}`;
      embed.addFields({name:'DSS Status',value:results[2].status +' '+ results[2].statusText})
    } else API.DSS.data = results[2].data as FSData

    // Second server's CSG
    if (typeof results[3] === 'string') {
      API.CSG.res = `DagMP:Second CSG failed, ${results[3]}`;
      embed.addFields({name:'CSG Status',value:results[3]})
    } else if (results[3].status != 200) {
      if (results[3].status === 204) embed.setImage(noContentImage);
      API.CSG.res = `DagMP:Second CSG failed with ${results[3].status +' '+ results[3].statusText}`;
      embed.addFields({name:'CSG Status',value:results[3].status +' '+ results[3].statusText})
    } else API.CSG.data = (client.xjs.xml2js(results[3].data,{compact:true}) as any).careerSavegame as FSCareerSavegame
  }).catch((err:Error)=>console.error(err.message))

  if (API.DSS.res.length != 0) {
    error = true;
    if (API.DSS.data.slots === undefined) return;
    console.log(client.logTime(), API.DSS.res);
  } else if (API.CSG.res.length != 0) {
    error = true;
    console.log(client.logTime(), API.CSG.res);
  }
  if (error) {// Nawdic broke it in his dream
    embed.setTitle('Host did not respond back in time').setColor(client.config.embedColorRed);
    return msg.edit({content:null, embeds:[embed]})
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
  const playersOnServer = API.DSS.data.slots?.players.filter(x=>x.isUsed);
  const playersInCache = client.MPServerCache[ServerName].players;
  if (!playersOnServer) return console.error(client.logTime(), '[MPLoop] Empty filter, ignoring...'); // For the love of god, stop throwing errors everytime.
  playersOnServer.forEach(player=>playerData.push(`**${player.name} ${player.isAdmin ? '| admin' : ''}**\nFarming for ${client.formatPlayerUptime(player.uptime)}`));

  ServerName = client.MPServerCache[ServerName].name; // Truncate unnecessary name for the embed
  if (API.DSS.data.server.name === 'Official Daggerwin Game Server') client.MPServerCache['main'].name = 'Daggerwin';
  //Second server name is unknown, will come back and update this later.

  if (API.DSS.data.server.name.length === 0){
    embed.setTitle('The server seems to be offline.').setColor(client.config.embedColorRed);
    msg.edit({content: 'This embed will resume when the server is back online.', embeds: [embed]});
    if (client.MPServerCache[ServerName].status === 'online') serverLog.send({embeds:[serverIndicatorEmbed('offline')]});
    client.MPServerCache[ServerName].status = 'offline';
  } else {
    if (client.MPServerCache[ServerName].status === 'offline'){
      serverLog.send({embeds:[serverIndicatorEmbed('online')]});
      isServerOnline = true
    };
    client.MPServerCache[ServerName].status = 'online';
    const statusEmbed = new client.embed().setColor(client.config.embedColor).setTitle('Server details').setFields(
      {name: 'Current Map', value: API.DSS.data.server.mapName.length === 0 ? '\u200b' : API.DSS.data.server.mapName, inline: true},
      {name: 'Version', value: API.DSS.data.server.version.length === 0 ? '\u200b' : API.DSS.data.server.version, inline: true},
      {name: 'In-game Time', value: `${('0'+Math.floor((API.DSS.data.server.dayTime/3600/1000))).slice(-2)}:${('0'+Math.floor((API.DSS.data.server.dayTime/60/1000)%60)).slice(-2)}`, inline: true},
      {name: 'Slot Usage', value: isNaN(Number(API.CSG.data.slotSystem?._attributes.slotUsage)) === true ? 'Unavailable' : Number(API.CSG.data.slotSystem?._attributes.slotUsage).toLocaleString('en-us'), inline: true},
      {name: 'Autosave Interval', value: isNaN(Number(API.CSG.data.settings?.autoSaveInterval._text)) === true ? 'Unavailable' : Number(API.CSG.data.settings?.autoSaveInterval._text).toFixed(0)+' mins', inline:true},
      {name: 'Timescale', value: isNaN(Number(API.CSG.data.settings?.timeScale._text)) === true ? 'Unavailable' : formatTimescale(Number(API.CSG.data.settings?.timeScale._text), 0, 'x'), inline: true}
    );
    embed.setColor(client.config.embedColor).setTitle(API.DSS.data.server.name).setDescription(API.DSS.data.slots.used === 0 ? '*No players online*' : playerData.join('\n\n')).setAuthor({name:`${API.DSS.data.slots.used}/${API.DSS.data.slots.capacity}`});
    msg.edit({content:'This embed updates every minute.',embeds:[statusEmbed,embed]});
  }

  if (!isServerOnline){
    playerLog();
    const Database:Array<number> = JSON.parse(readFileSync(`src/database/${ServerName}PlayerData.json`,{encoding:'utf8',flag:'r+'}));
    Database.push(API.DSS.data.slots?.used);
    writeFileSync(`src/database/${ServerName}PlayerData.json`, JSON.stringify(Database));
    client.MPServerCache[ServerName].players = playersOnServer
  }
}
 */