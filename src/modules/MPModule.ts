import Undici from 'undici';
import Discord from 'discord.js';
import TClient from '../client.js';
import ConfigHelper from '../helpers/ConfigHelper.js';
import FormatPlayer from '../helpers/FormatPlayer.js';
import Logger from '../helpers/Logger.js';
import HookMgr from '../components/HookManager.js';
import {IServer} from '../models/MPServer.js';
import {FSPlayer, FSData, FSCareerSavegame} from 'src/interfaces';

let loggingPrefix:string = 'MPModule';
let dataUnavailable:string = 'Unavailable';
export let refreshTimerSecs:number = 45000;
let isBotInDevMode:boolean = ConfigHelper.isDevMode();
let refreshIntrvlTxt:string = `Refreshes every ${refreshTimerSecs/1000} seconds.`;

export default async(client:TClient)=>{
  const message = await (client.channels.resolve(isBotInDevMode ? '1091300529696673792' : '543494084363288637') as Discord.TextChannel).messages.fetch(isBotInDevMode ? '1104563309451161742' : '1149141188079779900');
  if (!client.config.botSwitches.mpSys) return message.edit({content: null, embeds: [mpModuleDisabled(client)]});

  async function newServerEntry(server:IServer) {
    const serverData = await requestServerData(client, server);
    if (!serverData) return new client.embed().setColor(client.config.embedColorRed).setTitle('Server didn\'t respond').setFooter({text: 'Last updated'}).setTimestamp();
    const {dss, csg} = serverData;
    if (dss === null ?? csg === null ?? !dss ?? !csg ?? !dss.slots ?? !csg.slotSystem) return new client.embed().setColor(client.config.embedColorRed).setTitle(`${server.serverName} did not respond`).setFooter({text: 'Last updated'}).setTimestamp();
    // Skip the server if the parts of the data is missing.

    const formatTimescale =(number:number, digits:number, icon:string)=>Intl.NumberFormat(undefined, {minimumFractionDigits: digits}).format(number)+icon;
    const dataObj = {
      map: dss?.server?.mapName ?? dataUnavailable,
      version: dss?.server?.version ?? dataUnavailable,
      name: dss?.server?.name ?? dataUnavailable,
      time: `${('0'+Math.floor((dss?.server?.dayTime/3600/1000)%24)).slice(-2)}:${('0'+Math.floor((dss?.server?.dayTime/60/1000)%60)).slice(-2)}`,
      slotSys: csg?.slotSystem?.slotUsage,
      autoSave: isNaN(Number(csg?.settings?.autoSaveInterval)) ? dataUnavailable : Intl.NumberFormat('en-us').format(Number(csg?.settings?.autoSaveInterval)),
      timeScale: isNaN(Number(csg?.settings?.timeScale)) ? dataUnavailable : formatTimescale(Number(csg?.settings?.timeScale), 0, 'x')
    }

    function slotUsageFillbar(curr:number, max:number, barLength:number):string {
      const filled = Math.floor(curr/max*barLength);
      return '▏' + '━'.repeat(filled) + '▪' + '╍'.repeat(barLength-filled) + '▕';
    }
    const slotUsage = {
      consoleLimit: Number(csg?.slotSystem?.slotUsage) >= 2600 ? 4400 : 2600,
      text: `**${Intl.NumberFormat('en-us').format(Number(dataObj.slotSys))}**/**${Intl.NumberFormat('en-us').format(Number(csg?.slotSystem?.slotUsage) >= 2600 ? 4400 : 2600)}**`,
    }

    // Format the raw players data into Discord format
    let playerData:string[] = [];
    if (dss?.slots?.players === undefined) return;
    else {
      playerData.push(...dss?.slots?.players.filter(p=>p.isUsed).map(player=>playtimeStat(player)));
      storePlayerCount(client, server, dss?.slots?.used);
    }
    if (dss?.slots?.used < playerData.length) {
      // If the used slots is less than amount of players in playerData array, remove the unwanted amount of players from the array.
      // So it doesn't get displayed twice if the player switches or leaves the server.
      Logger.console('log', loggingPrefix, `Removing ${playerData.length - dss?.slots?.used} stuck players from ${server.serverName}`)
      playerData.shift()
    }

    if (dss?.server?.name.length < 1) return new client.embed().setColor(client.config.embedColorRed).setTitle('Server is offline').setFooter({text: 'Last updated'}).setTimestamp();
    const fields:Discord.APIEmbedField[] = [
      {name: 'Map', value: dataObj.map, inline: true},
      {name: 'Version', value: dataObj.version, inline: true},
      {name: 'Time', value: dataObj.time, inline: true},
      {name: 'Slot usage', value: isNaN(Number(dataObj.slotSys)) ? dataUnavailable : `${slotUsage.text}\n\`${slotUsageFillbar(Number(csg?.slotSystem?.slotUsage), slotUsage.consoleLimit, 10)}\``, inline: true},
      {name: 'Autosave', value: dataObj.autoSave+' mins', inline: true},
      {name: 'Timescale', value: dataObj.timeScale, inline: true}
    ];
    return new client.embed()
      .setColor(client.config.embedColor)
      .setTitle(dataObj.name).setFields(fields)
      .setAuthor({name: `${dss?.slots.used}/${dss?.slots.capacity}`})
      .setDescription(dss?.slots?.used < 1 ? '*Nobody is playing*' : playerData.join('\n\n'))
      .setFooter({text: 'Last updated'}).setTimestamp()
  }
  // Fetch the list of servers from Redis and submit the array to newServerEntry, note that the server's
  // embed can appear in different order on each cache pull, that's how Redis displays the servers in the array.
  const cachedServers = await client.MPServer.findInCache();
  let srvEmbedArray = await Promise.all(cachedServers.map(srv=>newServerEntry(srv)));
  message.edit({content: refreshIntrvlTxt, embeds: srvEmbedArray});

  // Locate the Multifarm server via port and call the webhook with that server's details. (Adddi's server)
  let hookId = isBotInDevMode ? '1098524887557099520' : '1159998634604109897';
  let msgId = isBotInDevMode ? '1159855742535352462' : '1160098458997370941';
  const mfServer = cachedServers.find(s=>s.ip.split(':')[1] === '18001' && s.isActive);
  if (mfServer) multifarmWebhook(client, mfServer, hookId, msgId);
}

async function multifarmWebhook(client:TClient, server:IServer, webhookId:string, messageId:string) {
  const txtMapping = {
    genericBools: {
      'false': 'Off',
      'true': 'On'
    },
    growthMode: {
      '1': 'Yes',
      '2': 'No',
      '3': 'Growth paused'
    },
    fuelUsage: {
      '1': 'Low',
      '2': 'Normal',
      '3': 'High'
    },
    dirtInterval: {
      '1': 'Off',
      '2': 'Slow',
      '3': 'Normal',
      '4': 'Fast'
    }
  };
  const getMappedValue =<T>(map:Record<string, T>, key:string, fallback:T):T=>map[key] ?? fallback;
  const data = await requestServerData(client, server);
  if (!data) return Logger.console('log', loggingPrefix, 'Couldn\'t get data for webhook');
  const {csg} = data;// :tutelBRUH: (https://cdn.discordapp.com/emojis/1155276126176956486.webp)
  const fields:Discord.APIEmbedField[] = [
    {name: 'Seasonal Growth', value: getMappedValue(txtMapping.growthMode, csg?.settings.growthMode, dataUnavailable), inline: true},
    {name: 'Crop Destruction', value: getMappedValue(txtMapping.genericBools, csg?.settings.fruitDestruction, dataUnavailable), inline: true},
    {name: 'Periodic Plowing', value: getMappedValue(txtMapping.genericBools, csg?.settings.plowingRequiredEnabled, dataUnavailable), inline: true},
    {name: 'Stones', value: getMappedValue(txtMapping.genericBools, csg?.settings.stonesEnabled, dataUnavailable), inline: true},
    {name: 'Lime', value: getMappedValue(txtMapping.genericBools, csg?.settings.limeRequired, dataUnavailable), inline: true},
    {name: 'Weeds', value: getMappedValue(txtMapping.genericBools, csg?.settings.weedsEnabled, dataUnavailable), inline: true},
    {name: 'Fuel Usage', value: getMappedValue(txtMapping.fuelUsage, csg?.settings.fuelUsage, dataUnavailable), inline: true},
    {name: 'Dirt Interval', value: getMappedValue(txtMapping.dirtInterval, csg?.settings.dirtInterval, dataUnavailable), inline: true}
  ];
  return new HookMgr(client, 'multifarm_chat', webhookId).edit(messageId, {
    content: refreshIntrvlTxt, embeds: [
      new client.embed().setColor(client.config.embedColor).setTitle(`Savegame Settings - ${csg?.settings?.mapTitle}`).addFields(fields).setFooter({text: 'Last updated'}).setTimestamp()
    ]
  })
}

async function storePlayerCount(client:TClient, server:IServer, playerCount:number) {
  return await client.MPServer.incrementPlayerCount(server.serverName, playerCount);
}

export async function requestServerData(client:TClient, server:IServer):Promise<{dss:FSData, csg:FSCareerSavegame}|undefined>{
  async function retryReqs(url:string, maxRetries:number) {
    // Attempt to reduce the failure rate of the requests before giving up and retrying in next refresh.
    for (let i = 0; i < maxRetries; i++) {
      try {
        const data = await Undici.fetch(url, {keepalive: true, signal: AbortSignal.timeout(12000), headers: {'User-Agent': `${client.user.username} - MPModule/undici`}});
        if (data.status === 200 ?? 204) return data;
        else if (data.status === 404) Logger.console('log', loggingPrefix, `(${i+1}/${maxRetries}) ${server.serverName} responded with an error (404), API is disabled or mismatched code`)
      } catch(err) {
        Logger.console('log', loggingPrefix, `Couldn't get the data for ${server.serverName}: ${err.message}`);
      }
      await new Promise(resolve=>setTimeout(resolve, 500))
    }
    return null;
  }
  try {
    const [DSSR, CSGR] = await Promise.allSettled([
      retryReqs('http://'+server.ip+'/feed/dedicated-server-stats.json?code='+server.code, 3).then(x=>x.json() as Promise<FSData>),
      retryReqs('http://'+server.ip+'/feed/dedicated-server-savegame.html?code='+server.code+'&file=careerSavegame', 3).then(async x=>(new client.fxp.XMLParser({ignoreAttributes: false, attributeNamePrefix: ''}).parse(await x.text())).careerSavegame as FSCareerSavegame)
    ]);
    const dss = DSSR.status === 'fulfilled' && DSSR.value && DSSR.value.server ? DSSR.value : null;
    const csg = CSGR.status === 'fulfilled' && CSGR.value && CSGR.value.slotSystem ? CSGR.value : null;
    if (dss && csg) return {dss, csg};
    else return null;
  } catch(err) {
    Logger.console('log', loggingPrefix, `Couldn't request ${server.serverName} for data: ${err.message}`);
    return {dss: null, csg: null}
  }
}

export function mpModuleDisabled(client:TClient) {
  return new client.embed().setColor(client.config.embedColorInvis).setTitle('MPModule is currently disabled.');
}

export function playtimeStat(player:FSPlayer) {
  let uptimeTxt = player.uptime < 1 ? 'Just joined' : `Playing for ${FormatPlayer.convertUptime(player.uptime)}`;
  return `**${player.name}${FormatPlayer.decoratePlayerIcons(player)}**\n${uptimeTxt}`
}
