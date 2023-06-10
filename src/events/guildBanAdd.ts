import Discord, { AuditLogEvent } from 'discord.js';
import TClient from '../client.js';
export default {
  async run(client:TClient, member:Discord.GuildMember){
    if (member.guild?.id != client.config.mainServer.id) return;
    const fetchBanlog = await member.guild.fetchAuditLogs({limit: 1, type: AuditLogEvent.MemberBanAdd})
    const banLog = fetchBanlog.entries.first();
    if (!banLog) return console.log(`Member was banned from ${member.guild.name} but no audit log for this member.`)
    const {executor, target, reason } = banLog;
    if (target.id === member.user.id) {
      const embed = new client.embed().setColor(client.config.embedColorRed).setTimestamp().setThumbnail(member.user.displayAvatarURL({size: 2048})).setTitle(`Member Banned: ${target.username}`).setDescription(`🔹 **User**\n<@${target.id}>\n\`${target.id}\``).addFields(
        {name: '🔹 Moderator', value: `<@${executor.id}>\n\`${executor.id}\``},
        {name: '🔹 Reason', value: `${reason === null ? 'Reason unspecified': reason}`}
      );
      if (!await client.userLevels._content.findById(member.user.id)) embed.setFooter({text:'Rank data has been wiped.'});
      (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [embed]})
    } else console.log(`User was banned from "${member.guild.name}" but no audit log could be fetched.`)
  }
}
