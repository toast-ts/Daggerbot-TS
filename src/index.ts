import Discord from 'discord.js';
import TClient from './client.js';
const client = new TClient;
client.init();
import Logger from './helpers/Logger.js';
import YTModule from './funcs/YTModule.js';
import MPModule from './funcs/MPModule.js';
import {Punishment} from './typings/interfaces';
import {writeFileSync, readFileSync} from 'node:fs';

// Error handler
function DZ(error:Error, type:string){// Yes, I may have shiternet but I don't need to wake up to like a hundred messages or so.
  if (JSON.parse(readFileSync('src/errorBlocklist.json', 'utf8')).includes(error.message)) return;// I wonder if my idea works, if not then please run me over with a bulldozer.
  console.error(error);
  (client.channels.resolve(client.config.mainServer.channels.errors) as Discord.TextChannel | null)?.send({embeds: [new client.embed().setColor('#560000').setTitle('Error caught!').setFooter({text: 'Error type: ' + type}).setDescription(`**Error:**\n\`\`\`${error.message}\`\`\`**Stack:**\n\`\`\`${`${error.stack}`.slice(0, 2500)}\`\`\``)]})
}
process.on('unhandledRejection', (error: Error)=>DZ(error, 'unhandledRejection'));
process.on('uncaughtException', (error: Error)=>DZ(error, 'uncaughtException'));
process.on('error', (error: Error)=>DZ(error, 'nodeError'));
client.on('error', (error: Error)=>DZ(error, 'clientError'));

// YouTube Upload notification and MP loop
if (client.config.botSwitches.mpstats) setInterval(async()=>{
  const serverlake = (await client.MPServer.findInCache(client.config.mainServer.id));
  for await (const [locName, locArea] of Object.entries(client.config.MPStatsLocation)) await MPModule(client, locArea.channel, locArea.message, serverlake[locName], locName)
}, 35000); // 35 seconds
setInterval(async()=>{
	YTModule(client, 'UCQ8k8yTDLITldfWYKDs3xFg', 'Daggerwin', '528967918772551702', '1155760735612305408'); // 528967918772551702 = #videos-and-streams; 1155760735612305408 = YT Upload Ping;
	YTModule(client, 'UCguI73--UraJpso4NizXNzA', 'Machinery Restorer', '767444045520961567', '1155760735612305408') // 767444045520961567 = #machinery-restorer; ^^
}, 300000); // 5 minutes

// Event loop for punishments and daily msgs
setInterval(async()=>{
  const now = Date.now();

  const punishments = await client.punishments.findInCache();
  punishments.filter((x:Punishment)=>x.endTime && x.endTime<= now && !x.expired).forEach(async (punishment:Punishment)=>{
    Logger.forwardToConsole('log', 'Punishment', `${punishment.member}\'s ${punishment.type} should expire now`);
    Logger.forwardToConsole('log', 'Punishment', await client.punishments.removePunishment(punishment._id, client.user.id, 'Time\'s up!'));
  });

  const formattedDate = Math.floor((now - client.config.LRSstart)/1000/60/60/24);
  const dailyMsgs = JSON.parse(readFileSync('./src/database/dailyMsgs.json', 'utf8'))
  if (client.config.botSwitches.dailyMsgsBackup && !dailyMsgs.some((x:Array<number>)=>x[0] === formattedDate)){
    client.userLevels.resetAllData(); // reset all data on 1st of January every year

    let total = (await client.userLevels._content.find({})).reduce((a,b)=>a + b.messages, 0); // sum of all users
    const yesterday = dailyMsgs.find((x:Array<number>)=>x[0] === formattedDate - 1);
    if (total < yesterday) total = yesterday // messages went down.
    dailyMsgs.push([formattedDate, total]);
    writeFileSync('./src/database/dailyMsgs.json', JSON.stringify(dailyMsgs))
    Logger.forwardToConsole('log', 'DailyMsgs', `Pushed [${formattedDate}, ${total}]`)
    client.guilds.cache.get(client.config.mainServer.id).commands.fetch().then(commands=>(client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send(`:pencil: Pushed \`[${formattedDate}, ${total}]\` to </rank leaderboard:${commands.find(x=>x.name === 'rank').id}>`));
    (client.channels.resolve(client.config.mainServer.channels.thismeanswar) as Discord.TextChannel).send({files:['./src/database/dailyMsgs.json']}).catch(fileErr=>console.log(fileErr))
  }
}, 5000)
