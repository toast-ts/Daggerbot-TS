import Discord from 'discord.js';
import TClient from '../client.js';
export default class RoleInfo {
  static run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    const role = interaction.options.getRole('role') as Discord.Role;
    const permissions = role.permissions.toArray();
    interaction.reply({embeds: [new client.embed().setColor(role.color || '#fefefe').setThumbnail(role?.iconURL()).setTitle(`Role Info: ${role.name}`).addFields(
      {name: '🔹 ID', value: `\`${role.id}\``, inline: true},
      {name: '🔹 Color', value: `\`${role.hexColor}\``, inline: true},
      {name: '🔹 Creation Date', value: `<t:${Math.round(role.createdTimestamp/1000)}>\n<t:${Math.round(role.createdTimestamp/1000)}:R>`, inline: true},
      {name: '🔹 Misc', value: `Hoist: \`${role.hoist}\`\nMentionable: \`${role.mentionable}\`\nPosition: \`${role.position}\` from bottom\nMembers: \`${role.members.size}\`\n${role.members.size < 21 ? role.members.map((e:Discord.GuildMember)=>`**${e.user.username}**`).join('\n') || '' : ''}`, inline: true},
      {name: '🔹 Permissions', value: `${permissions.includes('Administrator') ? ['Administrator'] : permissions.join(', ').replace(/([a-z])([A-Z])|([A-Z])([A-Z][a-z])/g, '$1$3 $2$4') || 'No permissions'}`, inline: true}
    )]})
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('View information about the selected role')
    .addRoleOption(x=>x
      .setName('role')
      .setDescription('Role name to view information')
      .setRequired(true))
}
