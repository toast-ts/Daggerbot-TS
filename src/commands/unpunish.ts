import Discord from 'discord.js';
import TClient from '../client.js';
import Logger from '../helpers/Logger.js';
import MessageTool from '../helpers/MessageTool.js';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!MessageTool.isStaff(interaction.member as Discord.GuildMember)) return MessageTool.youNeedRole(interaction, 'dcmod');
    const punishment = (await client.punishments._content.find({})).find(x=>x._id === interaction.options.getInteger('case_id', true));
    if (!punishment) return interaction.reply({content: 'Invalid Case ID', ephemeral: true});
    if (punishment.expired) return interaction.reply('This case has been overwritten by another case.');
    const reason = interaction.options.getString('reason') ?? 'Reason unspecified';
    await client.punishments.removePunishment(punishment.id, interaction.user.id, reason, interaction);
    Logger.forwardToConsole('log', 'UnpunishmentLog', `Case #${interaction.options.getInteger('case_id')} was used in /${interaction.commandName} for ${reason}`);
    (client.channels.cache.get(client.config.mainServer.channels.punishment_log) as Discord.TextChannel).send({embeds:[new client.embed().setColor(client.config.embedColor).setTitle('Unpunishment Log').setDescription(`Case #${interaction.options.getInteger('case_id')} was used in \`/${interaction.commandName}\` for \`${reason}\``).setTimestamp()]});
  },
  data: new Discord.SlashCommandBuilder()
    .setName('unpunish')
    .setDescription('Remove the active punishment from a member')
    .addIntegerOption(x=>x
      .setName('case_id')
      .setDescription('Case ID of the punishment to be overwritten')
      .setRequired(true))
    .addStringOption(x=>x
      .setName('reason')
      .setDescription('Reason for removing the punishment'))
}
