import Discord from 'discord.js';
import TClient from '../client.js';
export default class ChannelUpdate {
  static async run(client:TClient, oldChannel:Discord.GuildChannel, newChannel:Discord.GuildChannel) {
    if (!client.config.botSwitches.logs) return;
    if (oldChannel.guild?.id != client.config.dcServer.id) return;

    const auditChupdate = (await newChannel.guild.fetchAuditLogs({limit: 1, type: Discord.AuditLogEvent.ChannelUpdate})).entries.first();
    if (!auditChupdate) return console.log(`Channel (${oldChannel.name}) was updated but no audit log found for this channel.`);

    const serverLog = client.channels.cache.get(client.config.dcServer.channels.server_log) as Discord.TextChannel;
    const embed = new client.embed().setColor(client.config.embedColor).setFooter({text: auditChupdate.executor.displayName, iconURL: auditChupdate.executor.displayAvatarURL({size: 2048})}).setTimestamp();

    if (auditChupdate.changes.length > 0) {
      const changes = auditChupdate.changes;
      const formatAudit =(auditValue:Discord.AuditLogChange)=>`${auditValue.old === undefined ? 'None' : auditValue.old} ➜ ${auditValue.new === '' ? 'None' : auditValue.new}`;

      embed.setTitle(`\`${oldChannel.name}\` was updated`).setTimestamp(auditChupdate.createdTimestamp);
      for (const change of changes) {
        if (change.key === 'name') embed.addFields({name: 'Name', value: formatAudit(change), inline: true});
        if (change.key === 'topic') embed.addFields({name: 'Topic', value: formatAudit(change), inline: true});
      }

      await serverLog.send({embeds: [embed]});
    }
  }
}
