import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
import Logger from '../helpers/Logger.js';
export default async(client:TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>, type: 'ban'|'softban'|'kick'|'mute'|'warn'|'remind')=>{
  if (!MessageTool.isModerator(interaction.member)) return MessageTool.youNeedRole(interaction, 'dcmod');

  const isInBKL = ['ban', 'kick'].includes(type) && interaction.channelId === client.config.dcServer.channels.bankick_log;
  const time = interaction.options.getString('time') ?? undefined;
  const reason = interaction.options.getString('reason') ?? 'Reason unspecified';
  const GuildMember = interaction.options.getMember('member') ?? undefined;
  const User = interaction.options.getUser('member', true);
  if (reason.length > 1020) return interaction.reply({content: 'Reason cannot be longer than 1020 characters due to Discord\'s limit.', ephemeral: true});

  const punishLog = `\`${GuildMember?.user?.username ?? User?.username ?? 'No user data'}\` ${time ? ['warn', 'kick'].includes(type) ? 'and no duration set' : `and \`${time}\` (duration)` : ''} was used in \`/${interaction.commandName}\` for \`${reason}\``;
  Logger.console('log', 'PunishmentLog', punishLog);
  (client.channels.cache.get(client.config.dcServer.channels.punishment_log) as Discord.TextChannel).send({embeds:[new client.embed().setColor(client.config.embedColor).setAuthor({name: interaction.user.username, iconURL: interaction.user.avatarURL({size:2048})}).setTitle('Punishment Log').setDescription(punishLog).setTimestamp()]});

  if (GuildMember && !GuildMember?.moderatable) return interaction.reply(`I cannot ${type} this user.`);
  if (interaction.user.id === User.id) return interaction.reply(`You cannot ${type} yourself.`);
  if (!GuildMember && !['unban', 'ban'].includes(type)) return interaction.reply(`You cannot ${type} someone who is not in the server.`);
  if (User.bot) return interaction.reply(`You cannot ${type} a bot!`);

  await interaction.deferReply({ephemeral: isInBKL});
  await client.punishments.punishmentAdd(type, {time, interaction}, interaction.user.id, reason, User, GuildMember);
}
