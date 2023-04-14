import Discord,{SlashCommandBuilder} from 'discord.js';
import TClient from '../client.js';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!client.isStaff(interaction.member as Discord.GuildMember)) return client.youNeedRole(interaction, 'dcmod');
    const punishment = (await client.punishments._content.find({})).find(x=>x._id === interaction.options.getInteger('case_id', true));
    if (!punishment) return interaction.reply({content: 'Invalid Case ID', ephemeral: true});
    if (punishment.expired) return interaction.reply('This case has been overwritten by another case.');
    const reason = interaction.options.getString('reason') ?? 'Reason unspecified';
    await client.punishments.removePunishment(punishment.id, interaction.user.id, reason, interaction);
  },
  data: new SlashCommandBuilder()
    .setName('unpunish')
    .setDescription('Remove the active punishment from a member')
    .addIntegerOption((opt)=>opt
      .setName('case_id')
      .setDescription('Case ID of the punishment to be overwritten')
      .setRequired(true))
    .addStringOption((opt)=>opt
      .setName('reason')
      .setDescription('Reason for removing the punishment'))
}