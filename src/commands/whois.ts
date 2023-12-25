import Discord from 'discord.js';
import TClient from '../client.js';

function convert(status?:Discord.ClientPresenceStatus){
  if (status) return {
    idle: '🟡',
    dnd: '🔴',
    online: '🟢'
  }[status];
  else return '⚫'
}

export default class Whois {
  static async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    const member = interaction.options.getMember('member') as Discord.GuildMember;
    if (member === null){
      const user = interaction.options.getUser('member') as Discord.User;
      interaction.reply({embeds: [new client.embed()
        .setColor(client.config.embedColor)
        .setURL(`https://discord.com/users/${user.id}`)
        .setThumbnail(user.avatarURL({size:2048}) || user.defaultAvatarURL)
        .setTitle(`${user.bot ? 'Bot' : 'User'} Info: ${user.username}`)
        .setDescription(`<@${user.id}>\n\`${user.id}\``)
        .addFields({name: '🔹 Account Creation Date', value: `<t:${Math.round(user.createdTimestamp/1000)}>\n<t:${Math.round(user.createdTimestamp/1000)}:R>`})
      ]})
    } else {
      await member.user.fetch();
      const presence = member.presence?.clientStatus as Discord.ClientPresenceStatusData;
      const embedArray = [];
      let title = 'Member';
      if (member.user.bot) title = 'Bot';
      else if (member.user.id === interaction.guild.ownerId) title = ':crown: Server Owner';

      const embed = new client.embed()
        .setColor(member.displayColor || client.config.embedColor)
        .setURL(`https://discord.com/users/${member.user.id}`)
        .setThumbnail(member.avatarURL({size:2048}) || member.user.avatarURL({size:2048}) || member.user.defaultAvatarURL)
        .setImage(member.user.bannerURL({size:1024}) || null)
        .setTitle(`${title} Info: ${member.user.username}`)
        .setDescription(`<@${member.user.id}>\n\`${member.user.id}\``)
        .addFields(
          {name: '🔹 Account Creation Date', value: `<t:${Math.round(member.user.createdTimestamp/1000)}>\n<t:${Math.round(member.user.createdTimestamp/1000)}:R>`},
          {name: '🔹 Server Join Date', value: `<t:${Math.round((member.joinedTimestamp as number)/1000)}>\n<t:${Math.round((member.joinedTimestamp as number)/1000)}:R>`},
          {name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: member.roles.cache.size > 1 ? member.roles.cache.filter(x=>x.id !== interaction.guild.roles.everyone.id).sort((a,b)=>b.position - a.position).map(x=>x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0,1024) : 'No roles'}
        )
      if (member.premiumSinceTimestamp !== null) embed.addFields({name: '🔹 Server Boosting since', value: `<t:${Math.round(member.premiumSinceTimestamp/1000)}>\n<t:${Math.round(member.premiumSinceTimestamp/1000)}:R>`, inline: true})
      if (!presence) embed.addFields({name: '🔹 Status: ⚫', value: '\u200b'})
      if (member.presence) embed.addFields({name: '🔹 Status:', value: `${member.presence.status === 'offline' ? '⚫' : `Desktop: ${convert(presence.desktop)}\nWeb: ${convert(presence.web)}\nMobile: ${convert(presence.mobile)}`}`, inline: true})
      embedArray.push(embed)
      if (member.presence?.activities.find(a=>a.type === 2)) {
        const spotifyStatus = member.presence?.activities.find(a=>a.name === 'Spotify') as Discord.Activity;
        const spotifyEmbed = new client.embed()
          .setColor('#1DB954') // Thanks Copilot, I never knew I needed this shade of green. It's actually looks like Spotify's color.
          .setThumbnail(spotifyStatus?.assets.largeImageURL())
          .setAuthor({name: 'Spotify', iconURL: 'https://cdn.discordapp.com/emojis/510214342034325504.webp?quality=lossless'})
          .addFields(
            {name: 'Artist', value: spotifyStatus?.state, inline: true},
            {name: 'Title', value: spotifyStatus?.details, inline: true},
            {name: 'Started', value: `<t:${Math.round(spotifyStatus?.timestamps.start as unknown as number/1000)}>\n<t:${Math.round(spotifyStatus?.timestamps.start as unknown as number/1000)}:R>`, inline: false}
          )
        embedArray.push(spotifyEmbed)
      }
      interaction.reply({embeds: embedArray})
    }
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('whois')
    .setDescription('View your own or someone else\'s information')
    .addUserOption(x=>x
      .setName('member')
      .setDescription('Member or user to view their information')
      .setRequired(true))
}
