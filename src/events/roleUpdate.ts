import Discord, { AuditLogEvent } from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'roleUpdate',
    execute: async(client:TClient, oldRole:Discord.Role, newRole:Discord.Role)=>{
        const fetchRoleUpdoot = await client.guilds.cache.get(oldRole.guild.id).fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.RoleUpdate
        })
        const roleLog = fetchRoleUpdoot.entries.first();
        if (!roleLog) return
        const {executor, target} = roleLog;        
        if (target) {
            const embed = new client.embed().setColor(newRole.hexColor).setTimestamp().setTitle(`Role modified: ${oldRole.name}`).setDescription(`🔹 **Role**\n${target}\n\`${target.id}\``).addFields(
                {name: `${executor.bot ? '🔹 Bot' : '🔹 Admin'}`, value: `<@${executor.id}>\n\`${executor.id}\``},
                {name: '🔹 Role changes', value: `**Old color:** ${oldRole.hexColor}\n**New color:** ${newRole.hexColor}`}
            );
            (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [embed]})
        } else {
            console.log(`${target.id} was modified from ${client.guilds.cache.get(oldRole.guild.name)} but no audit log could be fetched.`)
        }
    }
}