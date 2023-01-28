import Discord,{SlashCommandBuilder} from 'discord.js';
import TClient from 'src/client';

function convert(status:string){
    switch (status){
        case 'offline':
            return '⚫'
        case 'idle':
            return '🟡'
        case 'dnd':
            return '🔴'
        case 'online':
            return '🟢'
    }
}

export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        const member = interaction.options.getMember('member') as Discord.GuildMember;
        if (member == null){
            const user = interaction.options.getUser('member') as Discord.User;
            const embed = new client.embed()
                .setColor(client.config.embedColor)
                .setURL(`https://discord.com/users/${user.id}`)
                .setThumbnail(user.avatarURL({size:2048}) || user.defaultAvatarURL)
                .setTitle(`${user.bot ? 'Bot': 'User'} Info: ${user.tag}`)
                .setDescription(`<@${user.id}>\n\`${user.id}\``)
                .addFields({name: '🔹 Account Creation Date', value: `<t:${Math.round(user.createdTimestamp/1000)}>\n<t:${Math.round(user.createdTimestamp/1000)}:R>`})
            interaction.reply({embeds: [embed]})
        } else {
            await member.user.fetch();
            const embedArray = [];
            const embed0 = new client.embed()
                .setColor(member.displayColor || client.config.embedColor)
                .setURL(`https://discord.com/users/${member.user.id}`)
                .setThumbnail(member.user.avatarURL({size:2048}) || member.user.defaultAvatarURL)
                .setImage(member.user.bannerURL({size:1024}) as string)
                .setTitle(`${member.user.bot ? 'Bot' : 'Member'} Info: ${member.user.tag}`)
                .setDescription(`<@${member.user.id}>\n\`${member.user.id}\`${member.user.id === interaction.guild.ownerId ? '\n__**Server Owner**__ 👑' : ''}`)
                .addFields(
                    {name: '🔹 Account Creation Date', value: `<t:${Math.round(member.user.createdTimestamp/1000)}>\n<t:${Math.round(member.user.createdTimestamp/1000)}:R>`},
                    {name: '🔹 Server Join Date', value: `<t:${Math.round((member.joinedTimestamp as number)/1000)}>\n<t:${Math.round((member.joinedTimestamp as number)/1000)}:R>`},
                    {name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: member.roles.cache.size > 1 ? member.roles.cache.filter(x=>x.id !== interaction.guild.roles.everyone.id).sort((a,b)=>b.position - a.position).map(x=>x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0,1024) : 'No roles'}
                )
                if (member.premiumSinceTimestamp !== null){
                    embed0.addFields({name: '🔹 Server Boosting since', value: `<t:${Math.round(member.premiumSinceTimestamp/1000)}>\n<t:${Math.round(member.premiumSinceTimestamp/1000)}:R>`, inline: true})
                }
                if (member.presence){embed0.addFields({name: `🔹 Status: ${member.presence.status}`, value: `${member.presence.status === 'offline' ? '⚫' : `Desktop: ${(member.presence.clientStatus as Discord.ClientPresenceStatusData).desktop ? convert((member.presence.clientStatus as Discord.ClientPresenceStatusData).desktop as string) : convert('offline')}\nWeb: ${(member.presence.clientStatus as Discord.ClientPresenceStatusData).web ? convert((member.presence.clientStatus as Discord.ClientPresenceStatusData).web as string) : convert('offline')}\nMobile: ${(member.presence.clientStatus as Discord.ClientPresenceStatusData).mobile ? convert((member.presence.clientStatus as Discord.ClientPresenceStatusData).mobile as string) : convert('offline')}`}`, inline: true})}
                embedArray.push(embed0)
                interaction.reply({embeds: embedArray})
        }
    },
    data: new SlashCommandBuilder()
        .setName('whois')
        .setDescription('View your own or someone else\'s information')
        .addUserOption((opt)=>opt
            .setName('member')
            .setDescription('Member or user to view their information')
            .setRequired(true))
}