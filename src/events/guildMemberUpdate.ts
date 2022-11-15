import Discord from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'guildMemberUpdate',
    execute: async(client:TClient, oldMember:Discord.GuildMember, newMember:Discord.GuildMember)=>{
        if (oldMember.guild.id != client.config.mainServer.id) return;
        if (!client.config.botSwitches.logs) return;
        const channel = (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel)
        if (oldMember.nickname != newMember.nickname){
            const embed = new client.embed().setColor(client.config.embedColor).setTimestamp().setThumbnail(newMember.user.displayAvatarURL({size: 2048})).setTitle(`Nickname updated: ${newMember.user.tag}`).setDescription(`<@${newMember.user.id}>\n\`${newMember.user.id}\``).addFields(
                {name: '🔹 Old nickname', value: `\`\`\`${oldMember.nickname == null ? ' ' : oldMember.nickname}\`\`\``},
                {name: '🔹 New nickname', value: `\`\`\`${newMember.nickname == null ? ' ' : newMember.nickname}\`\`\``}
            );
            channel.send({embeds: [embed]})
        }
        /*
            todo: role update
                - howtobasic the nonexistent '._roles'
        
        const newRoles = newMember._roles.filter(x=>!oldMember._roles.some(y=>y==x));
        const oldRoles = oldMember._roles.filter(x=>!newMember._roles.some(y=>y==x));
        const embed = new client.embed().setColor(client.config.embedColor).setThumbnail(newMember.user.displayAvatarURL({size: 2048})).setTitle(`Role updated: ${newMember.user.tag}`).setDescription(`<@${newMember.user.id}>\n\`${newMember.user.id}\``)
        if (newRoles.length != 0){
            embed.addFields({name: '🔹 Role added', value: newRoles.map((x)=>`<@&${x}>`).join(' ')})
        }
        if (oldRoles.length != 0){
            embed.addFields({name: '🔹 Role removed', value: oldRoles.map((x)=>`<@&${x}>`).join(' ')})
        }
        channel.send({embeds: [embed]})
        */
    }
}