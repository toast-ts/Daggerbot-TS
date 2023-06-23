import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  run(client:TClient, oldMember:Discord.GuildMember, newMember:Discord.GuildMember){
    if (oldMember.guild.id != client.config.mainServer.id) return;
    if (!client.config.botSwitches.logs) return;
    const channel = (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel);
    if (oldMember.nickname != newMember.nickname){
      const embed = new client.embed().setColor(client.config.embedColor).setTimestamp().setThumbnail(newMember.user.displayAvatarURL({size: 2048})).setTitle(`Nickname updated: ${newMember.user.username}`).setDescription(`<@${newMember.user.id}>\n\`${newMember.user.id}\``)
      oldMember.nickname === null ? '' : embed.addFields({name: '🔹 Old nickname', value: `\`\`\`${oldMember.nickname}\`\`\``})
      newMember.nickname === null ? embed.setFooter({text:'Nickname has been reset.'}) : embed.addFields({name: '🔹 New nickname', value: `\`\`\`${newMember.nickname}\`\`\``})
      channel.send({embeds: [embed]})
    }

    const newRoles = newMember.roles.cache.map((x,i)=>i).filter(x=>!oldMember.roles.cache.map((x,i)=>i).some(y=>y===x));
    const oldRoles = oldMember.roles.cache.map((x,i)=>i).filter(x=>!newMember.roles.cache.map((x,i)=>i).some(y=>y===x));
    if (newRoles.length === 0 && oldRoles.length == 0) return;
    const embed = new client.embed().setColor(client.config.embedColor).setThumbnail(newMember.user.displayAvatarURL({size: 2048})).setTitle(`Role updated: ${newMember.user.username}`).setDescription(`<@${newMember.user.id}>\n\`${newMember.user.id}\``)
    if (newRoles.length != 0) embed.addFields({name: newRoles.length > 1 ? '🔹 Roles added' : '🔹 Role added', value: newRoles.map(x=>`<@&${x}>`).join(' ')});
    if (oldRoles.length != 0) embed.addFields({name: oldRoles.length > 1 ? '🔹 Roles removed' : '🔹 Role removed', value: oldRoles.map(x=>`<@&${x}>`).join(' ')});
    channel.send({embeds: [embed]})
  }
}
