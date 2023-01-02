import Discord from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'guildMemberAdd',
    execute: async(client:TClient, member:Discord.GuildMember)=>{
        //if (member.partial) return;
        if (
            member.partial
            || member.guild?.id != client.config.mainServer.id
        ) return;
        const index = member.guild.memberCount;
        const suffix = ((index)=>{
            const numbers = index.toString().split('').reverse(); // eg 1850 --> [0,5,8,1]
            if (numbers[1] === '1'){// this is some -teen
                return 'th';
            } else {
                if (numbers[0] === '1') return 'st';
                else if (numbers[0] === '2') return 'nd';
                else if (numbers[0] === '3') return 'rd';
                else return 'th';
            }
        })(index);

        const embed0: Discord.EmbedBuilder = new client.embed().setColor(client.config.embedColor).setThumbnail(member.user.displayAvatarURL({size: 2048}) || member.user.defaultAvatarURL).setTitle(`Welcome to Daggerwin, ${member.user.tag}!`).setFooter({text: `${index}${suffix} member`});
        (client.channels.resolve(client.config.mainServer.channels.welcome) as Discord.TextChannel).send({embeds: [embed0]})

        if (!client.config.botSwitches.logs) return;
        const oldInvites = client.invites;
        const newInvites = await member.guild.invites.fetch();
        const usedInvite = newInvites.find((inv:any)=>oldInvites.get(inv.code)?.uses < inv.uses);
        newInvites.forEach((inv:any)=>client.invites.set(inv.code,{uses: inv.uses, creator: inv.inviter.id}));

        const embed1 = new client.embed().setColor(client.config.embedColorGreen).setTimestamp().setThumbnail(member.user.displayAvatarURL({size: 2048})).setTitle(`Member Joined: ${member.user.tag}`).setDescription(`<@${member.user.id}>\n\`${member.user.id}\``).setFooter({text: `Total members: ${index}${suffix}`}).addFields(
            {name: '🔹 Account Creation Date', value: `<t:${Math.round(member.user.createdTimestamp/1000)}>\n<t:${Math.round(member.user.createdTimestamp/1000)}:R>`},
            {name: '🔹 Invite Data:', value: usedInvite ? `Invite: \`${usedInvite.code}\`\nCreated by: **${usedInvite.inviter?.tag}**` : 'No invite data could be found.'}
        );
        (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [embed1]})
    }
}
