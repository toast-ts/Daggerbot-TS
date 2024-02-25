import Discord from 'discord.js';
import TClient from '../client.js';
import Formatters from '../helpers/Formatters.js';
import MessageTool from '../helpers/MessageTool.js';
export default class Case {
	private static async updateEntry(client:TClient, caseId:number, reason:string) {
    const logsArray = [client.config.dcServer.channels.logs, client.config.dcServer.channels.bankick_log];
    for (const channelID of logsArray) {
      const channel = await client.channels.fetch(channelID) as Discord.TextChannel;
      if (channel && channel.type === Discord.ChannelType.GuildText) {
        const messages = await channel.messages.fetch({limit: 5});
        messages.forEach(async message=>{
          if (message?.embeds[0]?.title && message?.embeds[0]?.title.match(new RegExp(`Case #${caseId}`))) {
            const findIndex = message?.embeds[0].fields.findIndex(x=>x.name === 'Reason');
            await message.edit({embeds: [new client.embed(message.embeds[0]).spliceFields(findIndex, 1, {name: 'Reason', value: `\`${reason}\``})]});
          }
        })
      }
    }
  }
  static run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!MessageTool.isModerator(interaction.member)) return MessageTool.youNeedRole(interaction, 'dcmod');
    const caseId = interaction.options.getInteger('id');
    ({
      update: async()=>{
        const reason = interaction.options.getString('reason');
        await client.punishments.updateReason(caseId, reason);
        if (client.punishments.findCaseOrCancels('case_id', caseId)) {
          await this.updateEntry(client, caseId, reason);
          await interaction.reply({embeds: [new client.embed().setColor(client.config.embedColorGreen).setTitle('Case updated').setDescription(`Case #${caseId} has been successfully updated with new reason:\n\`${reason}\``)]});
        } else interaction.reply({embeds: [new client.embed().setColor(client.config.embedColorRed).setTitle('Case not updated').setDescription(`Case #${caseId} is not found in database, not updating the reason.`)]});
      },
      view: async()=>{
        const punishment = await client.punishments.findCaseOrCancels('case_id', caseId);
        if (!punishment) return interaction.reply('Case ID is not found in database.');
        const cancelledBy = punishment.dataValues.expired ? await client.punishments.findCaseOrCancels('cancels', punishment.dataValues.case_id) : null;
        const cancels = punishment.dataValues.cancels ? await client.punishments.findCaseOrCancels('case_id', punishment.dataValues.cancels) : null;
        const embed = new client.embed().setColor(client.config.embedColor).setTimestamp(Number(punishment.dataValues.time)).setTitle(`${punishment.dataValues.type[0].toUpperCase()+punishment.dataValues.type.slice(1)} | Case #${punishment.dataValues.case_id}`).addFields(
          {name: 'User', value: `${punishment.member_name}\n${MessageTool.formatMention(punishment.dataValues.member, 'user')}\n\`${punishment.dataValues.member}\``, inline: true},
          {name: 'Moderator', value: `${client.users.resolve(punishment.moderator).tag}\n${MessageTool.formatMention(punishment.dataValues.moderator, 'user')}\n\`${punishment.dataValues.moderator}\``, inline: true},
          {name: '\u200b', value: '\u200b', inline: true},
          {name: 'Reason', value: `\`${punishment.reason || 'Reason unspecified'}\``, inline: true})
        if (punishment.dataValues.duration) embed.addFields({name: 'Duration', value: `${Formatters.timeFormat(punishment.dataValues.duration, 100)}`})
        if (punishment.dataValues.expired) embed.addFields({name: 'Expired', value: `This case has been overwritten by Case #${cancelledBy.dataValues.case_id} with reason \`${cancelledBy.dataValues.reason}\``})
        if (punishment.dataValues.cancels) embed.addFields({name: 'Overwrites', value: `This case overwrites Case #${cancels.dataValues.case_id} with reason \`${cancels.dataValues.reason}\``})
        interaction.reply({embeds: [embed]});
      },
      member: async()=>{
        const user = (interaction.options.getUser('user') as Discord.User);
        if (user.bot) return interaction.reply(`**${user.username}**'s punishment history cannot be viewed as they are a bot.`)
        const punishments = await client.punishments.getAllCases();
        const userPunishmentData = punishments.filter(x=>x.dataValues.member === user.id).sort((a,b)=>b.dataValues.time-a.dataValues.time);
        const userPunishment = userPunishmentData.map(punishment=>{
          return {
            name: `${punishment.dataValues.type[0].toUpperCase()+punishment.dataValues.type.slice(1)} | Case #${punishment.dataValues.case_id}`,
            value: `Reason: \`${punishment.dataValues.reason}\`\n${punishment.dataValues.duration ? `Duration: ${Formatters.timeFormat(punishment.dataValues.duration, 3)}\n` : ''}Moderator: ${MessageTool.formatMention(punishment.dataValues.moderator, 'user')}${punishment.dataValues.expired ? `\nOverwritten by Case #${punishments.find(x=>x.dataValues.cancels===punishment.dataValues.case_id)?.case_id}` : ''}${punishment.dataValues.cancels ? `\nOverwrites Case #${punishment.dataValues.cancels}` : ''}`
          }
        });
        if (!userPunishment.length) return interaction.reply(`**${user.username}** has a clean record.`)
        const pageNum = interaction.options.getInteger('page') ?? 1;
        return interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle(`${user.username}'s punishment history`).setDescription(`**ID:** \`${user.id}\``).setFooter({text: `${userPunishment.length} total punishments. Viewing page ${pageNum} out of ${Math.ceil(userPunishment.length/6)}.`}).addFields(userPunishment.slice((pageNum - 1) * 6, pageNum * 6))]});
      }
    } as any)[interaction.options.getSubcommand()]();
	}
  static data = new Discord.SlashCommandBuilder()
    .setName('case')
    .setDescription('Retrieve case information or user\'s punishment history')
    .addSubcommand(x=>x
      .setName('view')
      .setDescription('View information of the case ID')
      .addIntegerOption(x=>x
        .setName('id')
        .setDescription('Case ID')
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('member')
      .setDescription('View member\'s punishment history')
      .addUserOption(x=>x
        .setName('user')
        .setDescription('Which user do you want to view their punishment history?')
        .setRequired(true))
      .addIntegerOption(x=>x
        .setName('page')
        .setDescription('Select the page number')))
    .addSubcommand(x=>x
      .setName('update')
      .setDescription('Update the case with new reason')
      .addIntegerOption(x=>x
        .setName('id')
        .setDescription('Case ID to be updated')
        .setRequired(true))
      .addStringOption(x=>x
        .setName('reason')
        .setDescription('New reason for the case')
        .setRequired(true)))
}
