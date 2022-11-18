import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        const role = interaction.options.getRole('role') as Discord.Role;
        const keyPerms = ['Administrator', 'KickMembers', 'BanMembers', 'ManageChannels', 'ManageGuild', 'ViewAuditLog', 'ManageMessages', 'MentionEveryone', 'UseExternalEmojis', 'ManageRoles', 'Manage EmojiandStickers', 'ModerateMembers']
        const permissions = role.permissions.toArray();
        const Role = role.members.map((e:Discord.GuildMember)=>`**${e.user.tag}**`).join('\n') || '';
        const embed = new client.embed().setColor(role.color || '#fefefe').setThumbnail(role?.iconURL()).setTitle(`Role Info: ${role.name}`).addFields(
            {name: '🔹 ID', value: `\`${role.id}\``, inline: true},
            {name: '🔹 Color', value: `\`${role.hexColor}\``, inline: true},
            {name: '🔹 Creation Date', value: `<t:${Math.round(role.createdTimestamp/1000)}>\n<t:${Math.round(role.createdTimestamp/1000)}:R>`, inline: true},
            {name: '🔹 Misc', value: `Hoist: \`${role.hoist}\`\nMentionable: \`${role.mentionable}\`\nPosition: \`${role.position}\` from bottom\nMembers: \`${role.members.size}\`\n${role.members.size < 21 ? Role : ''}`, inline: true},
            {name: '🔹 Permissions', value: (permissions.includes('Administrator') ? ['Administrator'] : permissions.filter((x:string)=>keyPerms.includes(x))).map((x:string)=>{return x.split('_').map((y,i)=>y).join(' ')}).join(', ') || 'None', inline: true}
        )
        interaction.reply({embeds: [embed]})
    },
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('View information about the selected role')
        .addRoleOption((opt)=>opt
            .setName('role')
            .setDescription('Role name to view information')
            .setRequired(true))
}