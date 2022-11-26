import Discord, { AuditLogEvent } from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'roleUpdate',
    execute: async(client:TClient, oldRole:Discord.Role, newRole:Discord.Role)=>{
        if (oldRole.guild?.id != client.config.mainServer.id) return;
        const fetchRoleUpdoot = await client.guilds.cache.get(oldRole.guild.id).fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.RoleUpdate
        })
        const roleLog = fetchRoleUpdoot.entries.first();
        if (!roleLog) return
        const {executor, target} = roleLog;        
        if (target) {
            const embed = new client.embed().setColor(newRole.hexColor).setThumbnail(newRole?.iconURL()).setTimestamp().setTitle(`Role modified: ${newRole.name}`).setDescription(`🔹 **Role**\n${target}\n\`${target.id}\``).addFields(
                {name: `${executor.bot ? '🔹 Bot' : '🔹 Admin'}`, value: `<@${executor.id}>\n\`${executor.id}\``}
            );
            (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [embed]})
            // Moved addFields to these below cuz yes for each role changes, it seems inefficent to me but it will do. :)
            // Permissions field seems to trigger when role is hoisted/unhoisted atleast to me.
            if (oldRole.hexColor !== newRole.hexColor) {
                embed.addFields({name: '🔹 Role changes', value: `**Old color:** ${oldRole.hexColor}\n**New color:** ${newRole.hexColor}`})
            } else if (oldRole.name !== newRole.name) {
                embed.addFields({name: '🔹 Role changes', value: `**Old name:** ${oldRole.name}\n**New name:** ${newRole.name}`})
            } else if (oldRole.permissions !== newRole.permissions) {
                embed.addFields({name: '🔹 Role changes', value: `**Old permission(s):** ${newRole.permissions.missing(oldRole.permissions)}\n**New permission(s):** ${oldRole.permissions.missing(newRole.permissions)}`})
            }
        } else {
            console.log(`${target.id} was modified from ${client.guilds.cache.get(oldRole.guild.name)} but no audit log could be fetched.`)
        }
    }
}