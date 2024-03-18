import Discord from 'discord.js';
import TClient from './client.js';
const client = new TClient;
client.init();
import Logger from './helpers/Logger.js';
import YTModule from './modules/YTModule.js';
import CacheServer from './components/CacheServer.js';
import MPModule, {refreshTimerSecs} from './modules/MPModule.js';
import UsernameHelper from './helpers/UsernameHelper.js';
import {Punishment, RawGatewayPacket, RawMessageDelete, RawMessageUpdate} from 'src/interfaces';
import {readFileSync} from 'node:fs';
export const disabledChannels = ['548032776830582794', '541677709487505408', '949380187668242483'];

// Error handler
function _(error:Error, type:string) {
  if (JSON.parse(readFileSync('src/errorBlocklist.json', 'utf8')).includes(error.message)) return;
  console.error(error);
  (client.channels.resolve(client.config.dcServer.channels.errors) as Discord.TextChannel | null)?.send({embeds: [new client.embed().setColor('#560000').setTitle('Error caught!').setFooter({text: `Error type: ${type}`}).setDescription(`**Error:**\n\`\`\`${error.message}\`\`\`**Stack:**\n\`\`\`${`${UsernameHelper(error.stack)}`.slice(0, 2500)}\`\`\``)]});
}
process.on('unhandledRejection', (error: Error)=>_(error, 'unhandledRejection'));
process.on('uncaughtException', (error: Error)=>_(error, 'uncaughtException'));
process.on('error', (error: Error)=>_(error, 'processError'));
client.on('error', (error: Error)=>_(error, 'clientError'));
if ((typeof process.argv[4] === 'string' && process.argv[4] === 'true') ?? null) client.on('debug', console.log);

// Interval timers for modules
setInterval(async()=>await MPModule(client), refreshTimerSecs);
setInterval(()=>YTModule(client), 180000); // 3 minutes
setInterval(async()=>{
  const forum = client.guilds.cache.get(client.config.dcServer.id).channels.cache.get(client.config.dcServer.channels.help_forum) as Discord.ForumChannel;
  await forum.threads.fetch();

  for await (const thread of forum.threads.cache.values()) {
    await thread.messages.fetch();
    if (!thread.archived && thread.lastMessage.createdTimestamp <= Date.now() - 1555200000) {// check if thread is inactive for over 18 days
      await thread.delete();
      Logger.console('log', 'ThreadTimer', `"#${thread.name}" has been deleted due to inactivity for 18 days`);
    }
  }
}, 1200000); // 20 minutes

// Event loop for punishments and daily msgs
setInterval(async()=>{
  const now = Date.now();

  const checkExpiration = await client.userLevels.fetchEveryone();
  checkExpiration.filter(x=>x.isBlocked && x.time <= now).forEach(async user=>{
    Logger.console('log', 'LevelSystem', `${user.dataValues.id}'s block should expire now`);
    user.update({isBlocked: false, time: null}, {where: {id: user.dataValues.id}});
    client.users.send(user.dataValues.id, `Your rank block has expired, you can now continue to progress your level.`);
  });

  const punishments = await client.punishments.findInCache();
  punishments.filter((x:Punishment)=>x.endTime && x.endTime <= now && !x.expired).forEach(async (punishment:Punishment)=>{
    let key = `punishment_handled:${punishment.case_id}`;
    if (await CacheServer.get(key, false)) return;
    await CacheServer.set(key, true, false).then(async()=>await CacheServer.expiry(key, 35));

    Logger.console('log', 'Punishment', `${punishment.member}\'s ${punishment.type} should expire now`);
    Logger.console('log', 'Punishment', await client.punishments.punishmentRemove(punishment.case_id, client.user.id, 'Time\'s up!'));
  });

  const formattedDate = Math.floor((now - client.config.LRSstart)/1000/60/60/24);
  const dailyMsgs = await client.dailyMsgs.fetchDays();
  if (client.config.botSwitches.dailyMsgsBackup && !dailyMsgs.some(x=>x[0] === formattedDate)) {
    if (!dailyMsgs.find(x=>x.dataValues.day === formattedDate)) {
      let total = (await client.userLevels.fetchEveryone()).reduce((a,b)=>a + b.messages, 0); // Sum of all users
      const yesterday = dailyMsgs.find(x=>x.day === formattedDate - 1)
      if (yesterday && total < yesterday.total) Logger.console('log', 'DailyMsgs', `Total messages for day ${formattedDate} is less than total messages for day ${formattedDate - 1}.`);
      // Update total if it's the same as yesterday's total
      if (yesterday && total === yesterday.total) total = (await client.userLevels.fetchEveryone()).reduce((a,b)=>a + b.messages, 0); // Recalculate total

      await client.dailyMsgs.newDay(formattedDate, total);
      Logger.console('log', 'DailyMsgs', `Pushed [${formattedDate}, ${total}]`)

      // Send notification to #bot-log that the data has been pushed to database.
      const commands = await client.guilds.cache.get(client.config.dcServer.id)?.commands.fetch();
      if (commands) (client.channels.resolve(client.config.dcServer.channels.bot_log) as Discord.TextChannel).send({embeds: [
        new client.embed().setDescription(`Pushed the following\ndata to </rank leaderboard:${commands.find(x=>x.name === 'rank').id}>`).setFields(
          {name: 'Day', value: formattedDate.toString(), inline: true},
          {name: 'Messages', value: Intl.NumberFormat('en-us').format(total).toString(), inline: true}
        ).setColor(client.config.embedColor)
      ]});
      else Logger.console('log', 'DailyMsgs', 'Rank command not found, cannot send notification in channel')
    }
  }
}, 5000)

if (client.config.botSwitches.dailyMsgsBackup) {
  client.userLevels.initSelfdestruct();
  client.userLevels.dataSweeper();
}
// Cronjob tasks

// Raw gateway event receivers
export let rawSwitches = {
  MESSAGE_UPDATE: false,
  MESSAGE_DELETE: false
};
if (!client.config.botSwitches.logs) {
  rawSwitches.MESSAGE_DELETE = true;
  rawSwitches.MESSAGE_UPDATE = true;
};
client.on('raw', async (packet:RawGatewayPacket<RawMessageUpdate>)=>{
  if (rawSwitches[packet.t] || packet.t !== 'MESSAGE_UPDATE') return;
  if (packet.d.guild_id != client.config.dcServer.id || disabledChannels.includes(packet.d.channel_id) || typeof packet.d.content === 'undefined') return;

  const channel = client.channels.cache.get(packet.d.channel_id) as Discord.TextBasedChannel;

  // Switched to console.log to prevent useless embed creation that has same content as the original message.
  if (!rawSwitches.MESSAGE_UPDATE && !packet.d.author.bot) return Logger.console('log', 'RawEvent:Edit', `Message was edited in #${(channel as Discord.TextChannel).name}`);
});

client.on('raw', async (packet:RawGatewayPacket<RawMessageDelete>)=>{
  if (rawSwitches[packet.t]) return;
  if (packet.t !== 'MESSAGE_DELETE' || packet.d.guild_id != client.config.dcServer.id || disabledChannels.includes(packet.d.channel_id)) return;

  Logger.console('log', 'RawEvent:Del', `Message was deleted in #${(client.channels.resolve(packet.d.channel_id) as Discord.TextChannel).name}`);
  rawSwitches[packet.t] = true;
});
