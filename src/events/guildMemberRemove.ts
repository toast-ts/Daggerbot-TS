import Discord from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'guildMemberRemove',
    execute: async(client:TClient, member:Discord.GuildMember)=>{
        if (!client.config.botSwitches.logs) return;
        if (!member.joinedTimestamp) return;
        if (member.guild?.id != client.config.mainServer.id) return;
        const embed = new client.embed().setColor(client.config.embedColorRed).setTimestamp().setThumbnail(member.user.displayAvatarURL({size: 2048}) as string).setTitle(`Member Left: ${member.user.tag}`).setDescription(`<@${member.user.id}>\n\`${member.user.id}\``).addFields(
            {name: '🔹 Account Creation Date', value: `<t:${Math.round(member.user.createdTimestamp/1000)}>\n<t:${Math.round(member.user.createdTimestamp/1000)}:R>`},
            {name: '🔹 Server Join Date', value: `<t:${Math.round(member.joinedTimestamp/1000)}>\n<t:${Math.round(member.joinedTimestamp/1000)}:R>`},
            {name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: `${member.roles.cache.size > 1 ? member.roles.cache.filter((x)=>x.id !== member.guild.roles.everyone.id).sort((a,b)=>b.position - a.position).map(x=>x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0,1024) : 'No roles'}`, inline: true},
            {name: '🔹 Level messages', value: `${client.userLevels._content[member.user.id]?.messages.toLocaleString('en-US') || 0}`, inline: true}
        );
        (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [embed]});
        delete client.userLevels._content[member.user.id];
    }
}
