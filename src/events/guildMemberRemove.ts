import Discord from 'discord.js';
import TClient from '../client';
export default {
  async run(client:TClient, member:Discord.GuildMember){
    if (!client.config.botSwitches.logs) return;
    if (!member.joinedTimestamp || member.guild?.id != client.config.mainServer.id) return;
    const levelData = await client.userLevels._content.findById(member.id);
    const embed = new client.embed().setColor(client.config.embedColorRed).setTimestamp().setThumbnail(member.user.displayAvatarURL({size: 2048}) as string).setTitle(`Member Left: ${member.user.tag}`).setDescription(`<@${member.user.id}>\n\`${member.user.id}\``).addFields(
      {name: '🔹 Account Creation Date', value: `<t:${Math.round(member.user.createdTimestamp/1000)}>\n<t:${Math.round(member.user.createdTimestamp/1000)}:R>`},
      {name: '🔹 Server Join Date', value: `<t:${Math.round(member.joinedTimestamp/1000)}>\n<t:${Math.round(member.joinedTimestamp/1000)}:R>`},
      {name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: `${member.roles.cache.size > 1 ? member.roles.cache.filter((x)=>x.id !== member.guild.roles.everyone.id).sort((a,b)=>b.position - a.position).map(x=>x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0,1024) : 'No roles'}`, inline: true}
    );
    if (levelData && levelData.messages > 1) embed.addFields({name: '🔹 Total messages', value: levelData.messages.toLocaleString('en-US'), inline: true});
    (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds:[embed]});
    await client.userLevels._content.findByIdAndDelete(member.id)
  }
}
