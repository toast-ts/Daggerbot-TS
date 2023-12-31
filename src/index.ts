import Discord from 'discord.js';
import TClient from './client.js';
const client = new TClient;
client.init();
import Logger from './helpers/Logger.js';
import YTModule from './modules/YTModule.js';
import MPModule, {refreshTimerSecs} from './modules/MPModule.js';
import UsernameHelper from './helpers/UsernameHelper.js';
import {Punishment} from 'src/interfaces';
import {readFileSync} from 'node:fs';

// Error handler
function _(error:Error, type:string) {
  if (JSON.parse(readFileSync('src/errorBlocklist.json', 'utf8')).includes(error.message)) return;
  console.error(error);
  (client.channels.resolve(client.config.dcServer.channels.errors) as Discord.TextChannel | null)?.send({embeds: [new client.embed().setColor('#560000').setTitle('Error caught!').setFooter({text: 'Error type: ' + type}).setDescription(`**Error:**\n\`\`\`${error.message}\`\`\`**Stack:**\n\`\`\`${`${UsernameHelper(error.stack)}`.slice(0, 2500)}\`\`\``)]})
}
process.on('unhandledRejection', (error: Error)=>_(error, 'unhandledRejection'));
process.on('uncaughtException', (error: Error)=>_(error, 'uncaughtException'));
process.on('error', (error: Error)=>_(error, 'processError'));
client.on('error', (error: Error)=>_(error, 'clientError'));

// Interval timers for modules
setInterval(async()=>await MPModule(client), refreshTimerSecs);
setInterval(()=>YTModule(client), 180000); // 3 minutes

// Event loop for punishments and daily msgs
setInterval(async()=>{
  const now = Date.now();

  const punishments = await client.punishments.findInCache();
  punishments.filter((x:Punishment)=>x.endTime && x.endTime <= now && !x.expired).forEach(async (punishment:Punishment)=>{
    Logger.console('log', 'Punishment', `${punishment.member}\'s ${punishment.type} should expire now`);
    Logger.console('log', 'Punishment', await client.punishments.punishmentRemove(punishment.case_id, client.user.id, 'Time\'s up!'));
  });

  const formattedDate = Math.floor((now - client.config.LRSstart)/1000/60/60/24);
  const dailyMsgs = await client.dailyMsgs.fetchDays();
  if (client.config.botSwitches.dailyMsgsBackup && !dailyMsgs.some(x=>x[0] === formattedDate)) {
    if (!dailyMsgs.find(x=>x.dataValues.day === formattedDate)) {
      let total = (await client.userLevels.fetchEveryone()).reduce((a,b)=>a + b.messages, 0); // Sum of all users
      const yesterday = dailyMsgs.find(x=>x.day === formattedDate - 1)
      if (total < yesterday?.total) total = yesterday.total; // Messages went down.
      await client.dailyMsgs.newDay(formattedDate, total);
      Logger.console('log', 'DailyMsgs', `Pushed [${formattedDate}, ${total}]`)

      // Send notification to #bot-log that the data has been pushed to database.
      const commands = await client.guilds.cache.get(client.config.dcServer.id)?.commands.fetch();
      if (commands) (client.channels.resolve(client.config.dcServer.channels.logs) as Discord.TextChannel).send({embeds: [
        new client.embed().setDescription(`Pushed the following\ndata to </rank leaderboard:${commands.find(x=>x.name === 'rank').id}>`).setFields(
          {name: 'Day', value: formattedDate.toString(), inline: true},
          {name: 'Messages', value: Intl.NumberFormat('en-us').format(total).toString(), inline: true}
        ).setColor(client.config.embedColor)
      ]});
      else Logger.console('log', 'DailyMsgs', 'Rank command not found, cannot send notification in channel')
    }
  }
}, 5000)

if (client.config.botSwitches.dailyMsgsBackup) client.userLevels.initSelfdestruct()
// Initiate the nuke on userLevels and dailyMsgs tables
// Also don't ask why it's outside the interval
