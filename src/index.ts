import Discord from 'discord.js';
import TClient from './client';
const client = new TClient;
client.init();
import fs from 'node:fs';
import {FSData, FSCareerSavegame} from './typings/interfaces';

client.on('ready', async()=>{
  setInterval(()=>client.user.setPresence(client.config.botPresence), 300000);
  await client.guilds.fetch(client.config.mainServer.id).then(async guild=>{
    await guild.members.fetch();
    setInterval(()=>guild.invites.fetch().then(invites=>invites.forEach(inv=>client.invites.set(inv.code, {uses: inv.uses, creator: inv.inviterId}))),300000)
  });
  if (client.config.botSwitches.registerCommands){
    client.config.whitelistedServers.forEach((guildId)=>(client.guilds.cache.get(guildId) as Discord.Guild).commands.set(client.registry).catch((e:Error)=>{
      console.log(`Couldn't register slash commands for ${guildId} because`, e.stack);
      (client.channels.resolve(client.config.mainServer.channels.errors) as Discord.TextChannel).send(`Cannot register slash commands for **${client.guilds.cache.get(guildId).name}** (\`${guildId}\`):\n\`\`\`${e.message}\`\`\``)
    }))
  };
  console.log(`${client.user.tag} has logged into Discord API`);
  console.log(client.config.botSwitches, client.config.whitelistedServers);
  (client.channels.resolve(client.config.mainServer.channels.bot_status) as Discord.TextChannel).send(`${client.user.username} is active\n\`\`\`json\n${Object.entries(client.config.botSwitches).map((hi)=>`${hi[0]}: ${hi[1]}`).join('\n')}\`\`\``);
  console.timeEnd('Startup')
})

// Handle errors
function DZ(error:Error, location:string){// Yes, I may have shiternet but I don't need to wake up to like a hundred messages or so.
  if (['getaddrinfo ENOTFOUND discord.com'].includes(error.message)) return;
  //console.error(error);
  const channel = client.channels.resolve(client.config.mainServer.channels.errors) as Discord.TextChannel | null;
  channel?.send({embeds: [new client.embed().setColor('#420420').setTitle('Error caught!').setFooter({text: location}).setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
}
process.on('unhandledRejection', (error: Error)=>DZ(error, 'unhandledRejection'));
process.on('uncaughtException', (error: Error)=>DZ(error, 'uncaughtException'));
process.on('error', (error: Error)=>DZ(error, 'process-error'));
client.on('error', (error: Error)=>DZ(error, 'client-error'));

// Daggerwin MP loop
setInterval(async()=>{
  if (!client.config.botSwitches.mpstats) return;
  const msg = await (client.channels.resolve('543494084363288637') as Discord.TextChannel).messages.fetch('1023699243183112192')
  const embed = new client.embed();
  let Players = [];
  let error;

  // Connect to DB to retrieve the Gameserver info to fetch data.
  const ServerURL = await client.MPServer._content.findById(client.config.mainServer.id);
  const MPURL = ServerURL.ip;
  const MPCode = ServerURL.code;
  const verifyURL = MPURL.match(/http|https/);
  const completedURL_DSS = MPURL+'/feed/dedicated-server-stats.json?code='+MPCode;
	const completedURL_CSG = MPURL+'/feed/dedicated-server-savegame.html?code='+MPCode+'&file=careerSavegame';
  const FSdss = {
    data: {} as FSData,
    fetchResult: '' as string
  };
  const FScsg = {
    data: {} as FSCareerSavegame,
    fetchResult: '' as string
  };
  if (!verifyURL) return msg.edit({content: '*Detected an invalid IP.*', embeds: null})
  async function serverData(client:TClient, URL: string){
    return await client.axios.get(URL, {timeout: 4000, maxContentLength: Infinity, headers: {'User-Agent': `Daggerbot/axios ${client.axios.VERSION}`}}).catch((error:Error)=>error.message)
  }
  await Promise.all([serverData(client, completedURL_DSS), serverData(client, completedURL_CSG)]).then(function(results){
    if (typeof results[0] == 'string'){
      FSdss.fetchResult = `DagMP DSS failed, ${results[0]}`;
      embed.addFields({name: 'DSS Status', value: results[0]})
    } else if (results[0].status != 200){
      FSdss.fetchResult = `DagMP DSS failed with ${results[0].status + ' ' + results[0].statusText}`;
      embed.addFields({name: 'DSS Status', value: results[0].status + ' ' + results[0].statusText})
    } else FSdss.data = results[0].data as FSData

    if (typeof results[1] == 'string'){
      FScsg.fetchResult = `DagMP CSG failed, ${results[1]}`;
      embed.addFields({name: 'CSG Status', value: results[1]})
    } else if (results[1].status != 200){
      if (results[1].status == 204) embed.setImage('https://http.cat/204');
      FScsg.fetchResult = `DagMP CSG failed with ${results[1].status + ' ' + results[1].statusText}`;
      embed.addFields({name: 'CSG Status', value: results[1].status + ' ' + results[1].statusText})
    } else FScsg.data = client.xjs.xml2js(results[1].data,{compact:true,spaces:2}).careerSavegame as FSCareerSavegame;
  }).catch((error)=>console.log(error))
  if (FSdss.fetchResult.length != 0){
    error = true;
    console.log(client.logTime(), FSdss.fetchResult);
  }
  if (FScsg.fetchResult.length != 0){
    error = true;
    console.log(client.logTime(), FScsg.fetchResult);
  }
  if (error) { // Blame RedRover and Nawdic
    embed.setTitle('Host is not responding').setColor(client.config.embedColorRed);
    msg.edit({content: null, embeds: [embed]})
    return;
  }

  const DB = JSON.parse(fs.readFileSync(__dirname + '/database/MPPlayerData.json', {encoding: 'utf8'}));
  DB.push(FSdss.data.slots.used)
  fs.writeFileSync(__dirname + '/database/MPPlayerData.json', JSON.stringify(DB))

  // Number format function
  function formatNumber(number: any, digits: any, icon: any){
    var n = Number(number)
    return n.toLocaleString(undefined, {minimumFractionDigits: digits})+icon
  } // Temporary workaround for fresh save.
  const slotSystem = isNaN(Number(FScsg.data.slotSystem?._attributes.slotUsage)) == true ? 'Unavailable' : Number(FScsg.data.slotSystem?._attributes.slotUsage).toLocaleString('en-US');
  const timeScale = isNaN(Number(FScsg.data.settings?.timeScale._text)) == true ? 'Unavailable' : formatNumber(Number(FScsg.data.settings?.timeScale._text), 0, 'x');

  if (FSdss.data.server.name.length == 0){
    embed.setTitle('The server seems to be offline.').setColor(client.config.embedColorRed);
    msg.edit({content: 'This embed will resume when server is back online.', embeds: [embed]})
  } else {
    const embed1 = new client.embed().setColor(client.config.embedColor).setTitle('Server details').addFields(
      {name: 'Current Map', value: `${FSdss.data.server.mapName.length == 0 ? '\u200b' : FSdss.data.server.mapName}`, inline: true},
	  {name: 'Version', value: `${FSdss.data.server.version.length == 0 ? '\u200b' : FSdss.data.server.version}`, inline: true},
	  {name: 'In-game Time', value: `${('0' + Math.floor((FSdss.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((FSdss.data.server.dayTime/60/1000)%60)).slice(-2)}`, inline: true},
	  {name: 'Slot Usage', value: `${slotSystem}`, inline: true},
      {name: 'Timescale', value: `${timeScale}`, inline: true}
    );
    FSdss.data.slots.players.filter((x)=>x.isUsed !== false).forEach(player=>Players.push(`**${player.name} ${player.isAdmin ? '| admin' : ''}**\nFarming for ${(Math.floor(player.uptime/60))} hr & ${('' + (player.uptime % 60)).slice(-2)} min`))
    embed.setDescription(`${FSdss.data.slots.used == 0 ? '*No players online*' : Players.join('\n\n')}`).setTitle(FSdss.data.server.name).setColor(client.config.embedColor)
    embed.setAuthor({name: `${FSdss.data.slots.used}/${FSdss.data.slots.capacity}`});
    msg.edit({content: 'This embed updates every minute.', embeds: [embed1, embed]})
  }
}, 60000)

// YouTube Upload notification
setInterval(async()=>{
	client.YTLoop('UCQ8k8yTDLITldfWYKDs3xFg', 'Daggerwin', '528967918772551702'); // 528967918772551702 = #videos-and-streams
	client.YTLoop('UCguI73--UraJpso4NizXNzA', 'Machinery Restorer', '767444045520961567') // 767444045520961567 = #machinery-restorer
}, 600000)

// Event loop for punishments and daily msgs
setInterval(async()=>{
  const now = Date.now();
  const lrsStart = client.config.LRSstart;
    
  const punishments = await client.punishments._content.find({});
  punishments.filter(x=>x.endTime && x.endTime<= now && !x.expired).forEach(async punishment=>{
    console.log(client.logTime(), `${punishment.member}\'s ${punishment.type} should expire now`);
    const unpunishResult = await client.punishments.removePunishment(punishment._id, client.user.id, 'Time\'s up!');
    console.log(client.logTime(), unpunishResult);
  });
    
  const formattedDate = Math.floor((now - lrsStart)/1000/60/60/24);
  const dailyMsgs = JSON.parse(fs.readFileSync(__dirname + '/database/dailyMsgs.json', {encoding: 'utf8'}))
  if (!dailyMsgs.some((x:Array<number>)=>x[0] === formattedDate)){
    let total = (await client.userLevels._content.find({})).reduce((a,b)=>a + b.messages, 0); // sum of all users
    const yesterday = dailyMsgs.find((x:Array<number>)=>x[0] === formattedDate - 1);
    if (total < yesterday) total = yesterday // messages went down.
    dailyMsgs.push([formattedDate, total]);
    fs.writeFileSync(__dirname + '/database/dailyMsgs.json', JSON.stringify(dailyMsgs))
    console.log(client.logTime(), `Pushed [${formattedDate}, ${total}] to dailyMsgs`);
    client.guilds.cache.get(client.config.mainServer.id).commands.fetch().then((commands)=>(client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send(`:pencil: Pushed \`[${formattedDate}, ${total}]\` to </rank leaderboard:${commands.find(x=>x.name == 'rank').id}>`))
  }
}, 5000)
