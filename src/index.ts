import Discord from 'discord.js';
import TClient from './client.js';
const client = new TClient;
client.init();
import MPLoop from './MPLoop.js';
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

// YouTube Upload notification and Daggerwin MP loop
setInterval(()=>MPLoop(client, client.config.MPStatsLocation.channel, client.config.MPStatsLocation.message, 'Daggerwin'), 60000);
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
  const dailyMsgs = JSON.parse(readFileSync('./src/database/dailyMsgs.json', {encoding: 'utf8'}))
  if (!dailyMsgs.some((x:Array<number>)=>x[0] === formattedDate)){
    let total = (await client.userLevels._content.find({})).reduce((a,b)=>a + b.messages, 0); // sum of all users
    const yesterday = dailyMsgs.find((x:Array<number>)=>x[0] === formattedDate - 1);
    if (total < yesterday) total = yesterday // messages went down.
    dailyMsgs.push([formattedDate, total]);
    writeFileSync('./src/database/dailyMsgs.json', JSON.stringify(dailyMsgs))
    console.log(client.logTime(), `Pushed [${formattedDate}, ${total}] to dailyMsgs`);
    client.guilds.cache.get(client.config.mainServer.id).commands.fetch().then((commands)=>(client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send(`:pencil: Pushed \`[${formattedDate}, ${total}]\` to </rank leaderboard:${commands.find(x=>x.name == 'rank').id}>`))
  }
}, 5000)
