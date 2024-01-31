import Discord from 'discord.js';
import TClient from '../client.js';
export default class GuildBanAdd {
  static async run(client:TClient, member:Discord.GuildMember){
    if (member.guild?.id != client.config.dcServer.id) return;
    const banLog = (await member.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.MemberBanAdd })).entries.first();
    if (!banLog) return console.log(`Member was banned from ${member.guild.name} but no audit log for this member.`)
    const {executor, target, reason } = banLog;
    if (target.id === member.user.id) {
      const embed = new client.embed().setColor(client.config.embedColorRed).setTimestamp().setThumbnail(member.user.displayAvatarURL({size: 2048}))
      .setTitle(`Member Banned: ${target.username}`).addFields(
        {name: '🔹 User', value: `<@${target.id}>\n\`${target.id}\``},
        {name: '🔹 Moderator', value: `<@${executor.id}>\n\`${executor.id}\``},
        {name: '🔹 Reason', value: reason === null ? 'Reason unspecified': reason}
      );
      if (!await client.userLevels.fetchUser(member.user.id)) embed.setFooter({text: 'Rank data has been wiped.'});
      (client.channels.resolve(client.config.dcServer.channels.logs) as Discord.TextChannel).send({embeds: [embed]})
    } else console.log(`User was banned from "${member.guild.name}" but no audit log could be fetched.`)
  }
}
