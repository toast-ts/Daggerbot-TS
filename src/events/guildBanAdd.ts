import Discord, { AuditLogEvent } from 'discord.js';
import TClient from '../client';
export default {
  async run(client:TClient, member:Discord.GuildMember){
    if (member.guild?.id != client.config.mainServer.id) return;
    const fetchBanlog = await member.guild.fetchAuditLogs({limit: 1, type: AuditLogEvent.MemberBanAdd})
    const banLog = fetchBanlog.entries.first();
    if (!banLog) return console.log(`${member.user.tag} was banned from ${member.guild.name} but no audit log for this user.`)
    const {executor, target, reason } = banLog;
    if (target.id == member.user.id) (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [
      new client.embed().setColor(client.config.embedColorRed).setTimestamp().setThumbnail(member.user.displayAvatarURL({size: 2048})).setTitle(`Member Banned: ${target.tag}`).setDescription(`🔹 **User**\n<@${target.id}>\n\`${target.id}\``).addFields(
        {name: '🔹 Moderator', value: `<@${executor.id}>\n\`${executor.id}\``},
        {name: '🔹 Reason', value: `${reason == null ? 'Reason unspecified': reason}`}
      )]});
    else console.log(`${target.tag} was banned from ${member.guild.name} but no audit log could be fetched.`)
  }
}
