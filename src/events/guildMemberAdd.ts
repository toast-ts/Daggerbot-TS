import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  async run(client:TClient, member:Discord.GuildMember){    
    if (member.partial || member.guild?.id != client.config.mainServer.id) return;
    const index = member.guild.memberCount;
    const suffix = (index=>{
      const numbers = index.toString().split('').reverse(); // eg 1850 --> [0,5,8,1]
      if (numbers[1] === '1') return 'th'; // this is some -teen
      else {
        if (numbers[0] === '1') return 'st';
        else if (numbers[0] === '2') return 'nd';
        else if (numbers[0] === '3') return 'rd';
        else return 'th';
      }
    })(index);
    let isBot = 'Bot';
    if (!member.user.bot) isBot = 'Member';
    if (!client.config.botSwitches.logs) return;
    (client.channels.resolve(client.config.mainServer.channels.welcome) as Discord.TextChannel).send({embeds: [new client.embed().setColor(client.config.embedColor).setThumbnail(member.user.displayAvatarURL({size: 2048}) || member.user.defaultAvatarURL).setTitle(`Welcome to Daggerwin, ${member.user.username}!`).setFooter({text: `${index}${suffix} member`})]})
    const newInvites = await member.guild.invites.fetch();
    const usedInvite = newInvites.find((inv:Discord.Invite)=>client.invites.get(inv.code)?.uses < inv.uses);
    newInvites.forEach((inv:Discord.Invite)=>client.invites.set(inv.code,{uses: inv.uses, creator: inv.inviterId, channel: inv.channel.name}));
    const evadedCase = await client.punishments._content.findOne({'member': member.user.id, type: 'mute', expired: undefined});
    (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [
    new client.embed().setColor(client.config.embedColorGreen).setTimestamp().setThumbnail(member.user.displayAvatarURL({size: 2048})).setTitle(`${isBot} Joined: ${member.user.username}`).setDescription(`<@${member.user.id}>\n\`${member.user.id}\``).setFooter({text: `Total members: ${index}${suffix}`}).addFields(
      {name: '🔹 Account Creation Date', value: `<t:${Math.round(member.user.createdTimestamp/1000)}>\n<t:${Math.round(member.user.createdTimestamp/1000)}:R>`},
      {name: '🔹 Invite Data:', value: usedInvite ? `Invite: \`${usedInvite.code}\`\nCreated by: **${usedInvite.inviter?.username}**\nChannel: **#${usedInvite.channel.name}**` : 'No invite data could be fetched.'}
    )]});
    if (evadedCase){
      (client.channels.resolve(client.config.mainServer.channels.dcmod_chat) as Discord.TextChannel).send({embeds: [new client.embed().setColor(client.config.embedColorYellow).setTitle('Case evasion detected').setDescription([
        `**${member.user.username}** (\`${member.user.id}\`) has been detected for case evasion.`,
        'Timeout has been automatically added. (25 days)'
      ].join('\n')).setTimestamp()]});
      await client.punishments.addPunishment('mute', {time: '25d'}, client.user.id, '[AUTOMOD] Case evasion', member.user, member)
    } 
  }
}
