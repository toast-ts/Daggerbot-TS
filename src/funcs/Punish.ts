import Discord from 'discord.js';
import TClient from '../client.js';
import LogPrefix from '../helpers/LogPrefix.js';

export default async(client:TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>, type: string)=>{
  if (!client.isStaff(interaction.member as Discord.GuildMember)) return client.youNeedRole(interaction, 'dcmod');

  const time = interaction.options.getString('time') ?? undefined;
  const reason = interaction.options.getString('reason') ?? 'Reason unspecified';
  const GuildMember = interaction.options.getMember('member') ?? undefined;
  const User = interaction.options.getUser('member', true);

  console.log(client.logTime(), LogPrefix('PunishmentLog'), `${GuildMember?.user?.username ?? User?.username ?? 'No user data'} ${time ? ['warn', 'kick'].includes(type) ? 'and no duration set' : `and ${time} (duration)` : ''} was used in /${interaction.commandName} for ${reason}`);
  (client.channels.cache.get(client.config.mainServer.channels.punishment_log) as Discord.TextChannel).send({embeds:[new client.embed().setColor(client.config.embedColor).setAuthor({name: interaction?.user?.username, iconURL: interaction?.user?.displayAvatarURL({size:2048})}).setTitle('Punishment Log').setDescription(`${GuildMember?.user?.username ?? User?.username ?? 'No user data'} ${time ? ['warn', 'kick'].includes(client.punishments.type) ? 'and no duration set' : `and ${time} (duration)` : ''} was used in \`/${interaction.commandName}\` for \`${reason}\``).setTimestamp()]});
  if (interaction.user.id === User.id) return interaction.reply(`You cannot ${type} yourself.`);
  if (!GuildMember && type != 'unban') return interaction.reply(`You cannot ${type} someone who is not in the server.`);
  if (User.bot) return interaction.reply(`You cannot ${type} a bot!`);

  await interaction.deferReply();
  await client.punishments.addPunishment(type, {time, interaction}, interaction.user.id, reason, User, GuildMember);
}
