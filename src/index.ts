import Discord from 'discord.js';
import TClient from './client.js';
const client = new TClient;
client.init();
import MPLoop from './MPLoop.js';
import {Player} from 'discord-player';
const player = Player.singleton(client);
import {writeFileSync, readFileSync} from 'node:fs';

client.on('ready', async()=>{
  await client.guilds.fetch(client.config.mainServer.id).then(async guild=>{
    await guild.members.fetch();
    setInterval(()=>{
      client.user.setPresence(client.config.botPresence);
      guild.invites.fetch().then(invites=>invites.forEach(inv=>client.invites.set(inv.code, {uses: inv.uses, creator: inv.inviterId, channel: inv.channel.name})))
    },300000)
  });
  if (client.config.botSwitches.registerCommands){
    console.log('Total commands: '+client.registry.length) //Debugging reasons.
    client.config.whitelistedServers.forEach(guildId=>(client.guilds.cache.get(guildId) as Discord.Guild).commands.set(client.registry).catch((e:Error)=>{
      console.log(`Couldn't register slash commands for ${guildId} because`, e.stack);
      (client.channels.resolve(client.config.mainServer.channels.errors) as Discord.TextChannel).send(`Cannot register slash commands for **${client.guilds.cache.get(guildId).name}** (\`${guildId}\`):\n\`\`\`${e.message}\`\`\``)
    }))
  };
  console.log(`${client.user.username} has logged into Discord API`);
  console.log(client.config.botSwitches, client.config.whitelistedServers);
  (client.channels.resolve(client.config.mainServer.channels.bot_status) as Discord.TextChannel).send({content: `${client.user.username} is active`, embeds:[new client.embed().setColor(client.config.embedColor).setDescription(`\`\`\`json\n${Object.entries(client.config.botSwitches).map(x=>`${x[0]}: ${x[1]}`).join('\n')}\`\`\``)]});
  console.timeEnd('Startup')
})

// Error handler
function DZ(error:Error, type:string){// Yes, I may have shiternet but I don't need to wake up to like a hundred messages or so.
  if ([
    'getaddrinfo ENOTFOUND discord.com', 'getaddrinfo EAI_AGAIN discord.com',
    '[Error: 30130000:error:0A000410:SSL', '[Error: F8200000:error:0A000410:SSL',
    'HTTPError: Internal Server Error'
  ].includes(error.message)) return;
  console.error(error);
  (client.channels.resolve(client.config.mainServer.channels.errors) as Discord.TextChannel | null)?.send({embeds: [new client.embed().setColor('#560000').setTitle('Error caught!').setFooter({text: 'Error type: ' + type}).setDescription(`**Error:**\n\`\`\`${error.message}\`\`\`**Stack:**\n\`\`\`${`${error.stack}`.slice(0, 2500)}\`\`\``)]})
}
process.on('unhandledRejection', (error: Error)=>DZ(error, 'unhandledRejection'));
process.on('uncaughtException', (error: Error)=>DZ(error, 'uncaughtException'));
process.on('error', (error: Error)=>DZ(error, 'nodeError'));
client.on('error', (error: Error)=>DZ(error, 'client-error'));

// Audio Player event handling
if (client.config.botSwitches.music){
  const playerEmbed =(color:Discord.ColorResolvable,title:string,thumbnail?:string,footer?:string)=>{
    const embed = new client.embed().setColor(color).setTitle(title);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (footer) embed.setFooter({text:footer})
    return embed
  }
  player.events.on('playerStart', (queue,track)=>queue.channel.send({embeds:[playerEmbed(client.config.embedColor, `Next up: ${track.raw.title} - ${track.raw.author}`,track.raw.thumbnail)]}));
  player.events.on('audioTrackAdd', (queue,track)=>queue.channel.send({embeds:[playerEmbed(client.config.embedColorGreen, `Added: ${track.raw.title} - ${track.raw.author}`,track.raw.thumbnail)]}));
  player.events.on('audioTrackRemove', (queue, track)=>queue.channel.send({embeds:[playerEmbed(client.config.embedColor, `Removed: ${track.raw.title} - ${track.raw.author}`,track.raw.thumbnail)]}));
  player.events.on('emptyQueue', queue=>{
    if (queue.tracks.size < 1) return queue.channel.send('There\'s no songs left in the queue, leaving voice channel in 15 seconds.').then(()=>setTimeout(()=>queue.connection.disconnect(), 15000))
  });
  player.events.on('playerPause', queue=>queue.channel.send({embeds:[playerEmbed(client.config.embedColor, 'Player has been paused.\nRun the command to unpause it')]}));
  /* player.events.on('debug', (queue,message)=>{
    console.log(client.logTime(), message)
  }) */
  player.events.on('playerError', (queue, error)=>DZ(error, 'playerError')); // I don't know if both of these actually works, because most
  player.events.on('error', (queue, error)=>DZ(error, 'playerInternalError')); // errors from the player is coming from unhandledRejection
}

// YouTube Upload notification and Daggerwin MP loop
setInterval(()=>{
  MPLoop(client, client.config.MPStatsLocation.main.channel, client.config.MPStatsLocation.main.message, 'Daggerwin')
  MPLoop(client, client.config.MPStatsLocation.second.channel, client.config.MPStatsLocation.second.message, 'SecondServer')
}, 60000);
setInterval(async()=>{
	client.YTLoop('UCQ8k8yTDLITldfWYKDs3xFg', 'Daggerwin', '528967918772551702'); // 528967918772551702 = #videos-and-streams
	client.YTLoop('UCguI73--UraJpso4NizXNzA', 'Machinery Restorer', '767444045520961567') // 767444045520961567 = #machinery-restorer
}, 300000)

// Event loop for punishments and daily msgs
setInterval(async()=>{
  const now = Date.now();

  const punishments = await client.punishments._content.find({});
  punishments.filter(x=>x.endTime && x.endTime<= now && !x.expired).forEach(async punishment=>{
    console.log(client.logTime(), `${punishment.member}\'s ${punishment.type} should expire now`);
    console.log(client.logTime(), await client.punishments.removePunishment(punishment._id, client.user.id, 'Time\'s up!'));
  });

  const formattedDate = Math.floor((now - client.config.LRSstart)/1000/60/60/24);
  const dailyMsgs = JSON.parse(readFileSync('./src/database/dailyMsgs.json', {encoding: 'utf8'}))
  if (client.config.botSwitches.dailyMsgsBackup && !dailyMsgs.some((x:Array<number>)=>x[0] === formattedDate)){
    let total = (await client.userLevels._content.find({})).reduce((a,b)=>a + b.messages, 0); // sum of all users
    const yesterday = dailyMsgs.find((x:Array<number>)=>x[0] === formattedDate - 1);
    if (total < yesterday) total = yesterday // messages went down.
    dailyMsgs.push([formattedDate, total]);
    writeFileSync('./src/database/dailyMsgs.json', JSON.stringify(dailyMsgs))
    console.log(client.logTime(), `Pushed [${formattedDate}, ${total}] to dailyMsgs`);
    client.guilds.cache.get(client.config.mainServer.id).commands.fetch().then(commands=>(client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send(`:pencil: Pushed \`[${formattedDate}, ${total}]\` to </rank leaderboard:${commands.find(x=>x.name === 'rank').id}>`));
    (client.channels.resolve(client.config.mainServer.channels.thismeanswar) as Discord.TextChannel).send({files:['./src/database/dailyMsgs.json']}).catch(fileErr=>console.log(fileErr))
  }
}, 5000)
