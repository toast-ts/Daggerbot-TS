import Discord, { AuditLogEvent } from 'discord.js';
import TClient from '../client';
export default {
    async run(client:TClient, member:Discord.GuildMember){
        if (member.guild?.id != client.config.mainServer.id) return;
        const fetchUnbanlog = await member.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanRemove
        })
        const unbanLog = fetchUnbanlog.entries.first();
        if (!unbanLog) return console.log(`${member.user.tag} was unbanned from ${member.guild.name} but no audit log for this user.`)
        const { executor, target, reason } = unbanLog;
        if (target.id == member.user.id) {
            const embed = new client.embed().setColor(client.config.embedColorGreen).setTimestamp().setThumbnail(member.user.displayAvatarURL({size: 2048})).setTitle(`Member Unbanned: ${target.tag}`).setDescription(`🔹 **User**\n<@${target.id}>\n\`${target.id}\``).addFields(
                {name: '🔹 Moderator', value: `<@${executor.id}>\n\`${executor.id}\``},
                {name: '🔹 Reason', value: `${reason == null ? 'Reason unspecified.': reason}`}
            );
            (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [embed]})
        } else {
            console.log(`${target.tag} was unbanned from ${member.guild.name} but no audit log could be fetched.`)
        }
    }
}
