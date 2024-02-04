import Discord from 'discord.js';
import TClient from '../client.js';
import Logger from '../helpers/Logger.js';
import MessageTool from '../helpers/MessageTool.js';
export default class Unpunish {
  static async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!MessageTool.isModerator(interaction.member as Discord.GuildMember)) return MessageTool.youNeedRole(interaction, 'dcmod');
    const punishment = await client.punishments.findCase(interaction.options.getInteger('case_id', true));
    if (!punishment) return interaction.reply({content: 'Case ID is not found in database.', ephemeral: true});
    if (['unban', 'unmute', 'punishmentOverride'].includes(punishment.dataValues.type)) return interaction.reply({content: 'This case ID is immutable. (Informative case)', ephemeral: true});
    if (punishment.dataValues.expired) return interaction.reply({content: 'This case ID is already expired.', ephemeral: true});
    const reason = interaction.options.getString('reason') ?? 'Reason unspecified';
    await client.punishments.punishmentRemove(punishment.dataValues.case_id, interaction.user.id, reason, interaction);

    const unpunishLog = `Case #${interaction.options.getInteger('case_id')} was used in \`/${interaction.commandName}\` for \`${reason}\``;
    Logger.console('log', 'UnpunishmentLog', unpunishLog);
    (client.channels.cache.get(client.config.dcServer.channels.punishment_log) as Discord.TextChannel).send({embeds:[new client.embed().setColor(client.config.embedColor).setTitle('Unpunishment Log').setDescription(unpunishLog).setTimestamp()]});
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('unpunish')
    .setDescription('Remove the active punishment from a member')
    .addIntegerOption(x=>x
      .setName('case_id')
      .setDescription('Case ID of the active punishment to be overwritten')
      .setRequired(true))
    .addStringOption(x=>x
      .setName('reason')
      .setDescription('Reason for removing the punishment'))
}
