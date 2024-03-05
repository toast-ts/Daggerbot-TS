import Discord from 'discord.js';
import TClient from '../client.js';
export default class GuildMemberRemove {
  static async run(client:TClient, member:Discord.GuildMember) {
    if (!client.config.botSwitches.logs) return;
    if (!member.joinedTimestamp || member.guild?.id != client.config.dcServer.id) return;
    client.memberJoinDates.set(member.user.id, `${Math.round(member.joinedTimestamp/1000)}`);
    if (client.guilds.cache.get(client.config.dcServer.id).bans.cache.has(member.id)) return await client.userLevels.deleteUser(member.id);
    let isBot = 'Bot';
    if (!member.user.bot) isBot = 'Member';
    const levelData = await client.userLevels.fetchUser(member.id);
    const embed = new client.embed().setColor(client.config.embedColorRed).setTimestamp().setThumbnail(member.user.displayAvatarURL({size: 2048}))
    .setTitle(`${isBot} Left: ${member.user.username}`).setFooter({text: `ID: ${member.user.id}`}).addFields(
      {name: '🔹 Account Creation Date', value: `<t:${Math.round(member.user.createdTimestamp/1000)}>\n<t:${Math.round(member.user.createdTimestamp/1000)}:R>`},
      {name: '🔹 Server Join Date', value: `<t:${Math.round(member.joinedTimestamp/1000)}>\n<t:${Math.round(member.joinedTimestamp/1000)}:R>`},
      {name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: `${member.roles.cache.size > 1 ? member.roles.cache.filter((x)=>x.id !== member.guild.roles.everyone.id).sort((a,b)=>b.position - a.position).map(x=>x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0,1024) : 'No roles'}`, inline: true}
    );
    if (levelData && levelData.dataValues.messages > 1) embed.addFields({name: '🔹 Total messages', value: levelData.dataValues.messages.toLocaleString('en-US'), inline: true});
    (client.channels.resolve(client.config.dcServer.channels.bot_log) as Discord.TextChannel).send({embeds: [embed]});
    await client.userLevels.deleteUser(member.id);
  }
}
