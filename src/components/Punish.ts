import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
export default async(client:TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>, type: 'ban'|'softban'|'kick'|'mute'|'warn'|'remind')=>{
  if (!MessageTool.isStaff(interaction.member)) return MessageTool.youNeedRole(interaction, 'dcmod');

  const time = interaction.options.getString('time') ?? undefined;
  const reason = interaction.options.getString('reason') ?? 'Reason unspecified';
  const GuildMember = interaction.options.getMember('member') ?? undefined;
  const User = interaction.options.getUser('member', true);

  if (interaction.user.id === User.id) return interaction.reply(`You cannot ${type} yourself.`);
  if (!GuildMember && !['unban', 'ban'].includes(type)) return interaction.reply(`You cannot ${type} someone who is not in the server.`);
  if (User.bot) return interaction.reply(`You cannot ${type} a bot!`);

  await interaction.deferReply();
  await client.punishments.punishmentAdd(type, {time, interaction}, interaction.user.id, reason, User, GuildMember);
}
