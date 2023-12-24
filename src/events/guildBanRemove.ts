import Discord, { AuditLogEvent } from 'discord.js';
import TClient from '../client.js';
export default class GuildBanRemove {
  static async run(client:TClient, member:Discord.GuildMember){
    if (member.guild?.id != client.config.dcServer.id) return;
    const unbanLog = (await member.guild.fetchAuditLogs({limit: 1, type: AuditLogEvent.MemberBanRemove})).entries.first();
    if (!unbanLog) return console.log(`User was unbanned from ${member.guild.name} but no audit log for this user.`)
    const { executor, target, reason } = unbanLog;
    if (target.id === member.user.id) (client.channels.resolve(client.config.dcServer.channels.logs) as Discord.TextChannel).send({embeds: [
      new client.embed().setColor(client.config.embedColorGreen).setTimestamp().setThumbnail(member.user.displayAvatarURL({size: 2048})).setTitle(`Member Unbanned: ${target.username}`).setDescription(`🔹 **User**\n<@${target.id}>\n\`${target.id}\``).addFields(
        {name: '🔹 Moderator', value: `<@${executor.id}>\n\`${executor.id}\``},
        {name: '🔹 Reason', value: `${reason === null ? 'Reason unspecified.': reason}`}
      )]});
    else console.log(`User was unbanned from ${member.guild.name} but no audit log could be fetched.`)
  }
}
