import Discord,{SlashCommandBuilder} from "discord.js";
import TClient from '../client.js';
export default {
	run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!client.isStaff(interaction.member)) return client.youNeedRole(interaction, 'dcmod');
    const caseId = interaction.options.getInteger('id');
    ({
      update: async()=>{
        const reason = interaction.options.getString('reason');
        await client.punishments._content.findByIdAndUpdate(caseId, {reason});
        if (await client.punishments._content.findById(caseId)) await interaction.reply({embeds: [new client.embed().setColor(client.config.embedColorGreen).setTitle('Case updated').setDescription(`Case #${caseId} has been successfully updated with new reason:\n\`${reason}\``)]});
        else interaction.reply({embeds: [new client.embed().setColor(client.config.embedColorRed).setTitle('Case not updated').setDescription(`Case #${caseId} is not stored on database, not updating the reason.`)]});
      },
      view: async()=>{
        const punishment = await client.punishments._content.findById(caseId);
        if (!punishment) return interaction.reply('Invalid Case ID');
        const cancelledBy = punishment.expired ? await client.punishments._content.findOne({cancels:punishment.id}) : null;
        const cancels = punishment.cancels ? await client.punishments._content.findOne({_id:punishment.cancels}) : null;
        const embed = new client.embed().setColor(client.config.embedColor).setTimestamp(punishment.time).setTitle(`${punishment.type[0].toUpperCase()+punishment.type.slice(1)} | Case #${punishment.id}`).addFields(
          {name: '🔹 User', value: `<@${punishment.member}> \`${punishment.member}\``, inline: true},
          {name: '🔹 Moderator', value: `<@${punishment.moderator}> \`${punishment.moderator}\``, inline: true},
          {name: '\u200b', value: '\u200b', inline: true},
          {name: '🔹 Reason', value: `\`${punishment.reason || 'Reason unspecified'}\``, inline: true})
        if (punishment.duration) embed.addFields({name: '🔹 Duration', value: client.formatTime(punishment.duration, 100)})
        if (punishment.expired) embed.addFields({name: '🔹 Expired', value: `This case has been overwritten by Case #${cancelledBy.id} for reason \`${cancelledBy.reason}\``})
        if (punishment.cancels) embed.addFields({name: '🔹 Overwrites', value: `This case overwrites Case #${cancels.id} with reason \`${cancels.reason}\``})
        interaction.reply({embeds: [embed]});
      },
      member: async()=>{
        const user = (interaction.options.getUser('user') as Discord.User);
        if (user.bot) return interaction.reply(`**${user.username}**'s punishment history cannot be viewed as they are a bot.`)
        const punishments = await client.punishments._content.find({});
        const userPunishmentData = await client.punishments._content.find({'member':user.id});
        const userPunishment = userPunishmentData.sort((a,b)=>a.time-b.time).map((punishment)=>{
          return {
            name: `${punishment.type[0].toUpperCase()+punishment.type.slice(1)} | Case #${punishment.id}`,
            value: `Reason: \`${punishment.reason}\`\n${punishment.duration ? `Duration: ${client.formatTime(punishment.duration, 3)}\n` : ''}Moderator: <@${punishment.moderator}>${punishment.expired ? `\nOverwritten by Case #${punishments.find(x=>x.cancels===punishment._id)?._id}` : ''}${punishment.cancels ? `\nOverwrites Case #${punishment.cancels}` : ''}`
          }
        });
        if (!punishments || !userPunishment) return interaction.reply(`**${user.username}** has a clean record.`)
        const pageNum = interaction.options.getInteger('page') ?? 1;
        return interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle(`${user.username}'s punishment history`).setDescription(`**ID:** \`${user.id}\``).setFooter({text: `${userPunishment.length} total punishments. Viewing page ${pageNum} out of ${Math.ceil(userPunishment.length/6)}.`}).addFields(userPunishment.slice((pageNum - 1) * 6, pageNum * 6))]});
      }
    } as any)[interaction.options.getSubcommand()]();
	},
  data: new SlashCommandBuilder()
    .setName('case')
    .setDescription('Retrieve case information or user\'s punishment history')
    .addSubcommand(opt=>opt
      .setName('view')
      .setDescription('View a multiple or single case')
      .addIntegerOption((optt)=>optt
        .setName('id')
        .setDescription('Case ID')
        .setRequired(true)))
    .addSubcommand(opt=>opt
      .setName('member')
      .setDescription('View member\'s punishment history')
      .addUserOption(optt=>optt
        .setName('user')
        .setDescription('Which user do you want to view their punishment history?')
        .setRequired(true))
      .addIntegerOption(optt=>optt
        .setName('page')
        .setDescription('Select the page number')))
    .addSubcommand(opt=>opt
      .setName('update')
      .setDescription('Update the case with new reason')
      .addIntegerOption(optt=>optt
        .setName('id')
        .setDescription('Case ID to be updated')
        .setRequired(true))
      .addStringOption(optt=>optt
        .setName('reason')
        .setDescription('New reason for the case')
        .setRequired(true)))
};