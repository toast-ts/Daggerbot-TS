import Discord,{SlashCommandBuilder} from "discord.js";
import TClient from 'src/client';
import { Punishment } from "src/typings/interfaces";
export default {
	async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        if (!client.isStaff(interaction.member)) return client.youNeedRole(interaction, 'dcmod');
        const Subb = interaction.options.getSubcommand();
        const caseId = interaction.options.getInteger('id');
        if (Subb == 'update'){
            const reason = interaction.options.getString('reason')
            client.punishments._content.find((x:Punishment)=>x.id==caseId).reason = reason;
            client.punishments.forceSave();
            const embed = new client.embed().setColor(client.config.embedColorGreen).setTitle('Case updated').setDescription(`Case #${caseId} has been successfully updated with new reason:\n\`${reason}\``);
            await interaction.reply({embeds: [embed]})
        } else if (Subb == 'view'){
            const punishment = client.punishments._content.find((x:Punishment)=>x.id==caseId);
            if (!punishment) return interaction.reply('Invalid case #');
            const cancelledBy = punishment.expired ? client.punishments._content.find((x:Punishment)=>x.cancels==punishment.id) : null;
            const cancels = punishment.cancels ? client.punishments._content.find((x:Punishment)=>x.id==punishment.cancels) : null;
            const embed = new client.embed().setColor(client.config.embedColor).setTimestamp(punishment.time).setTitle(`${client.formatPunishmentType(punishment, client, cancels)} | Case #${punishment.id}`).addFields(
                {name: '🔹 User', value: `<@${punishment.member}> \`${punishment.member}\``, inline: true},
                {name: '🔹 Moderator', value: `<@${punishment.moderator}> \`${punishment.moderator}\``, inline: true},
                {name: '\u200b', value: '\u200b', inline: true},
                {name: '🔹 Reason', value: `\`${punishment.reason || 'Reason unspecified'}\``, inline: true})
            if (punishment.duration){
                embed.addFields({name: '🔹 Duration', value: client.formatTime(punishment.duration, 100)})
            }
            if (punishment.expired) embed.addFields({name: '🔹 Expired', value: `This case has been overwritten by case #${cancelledBy.id} for reason \`${cancelledBy.reason}\``})
            if (punishment.cancels) embed.addFields({name: '🔹 Overwrites', value: `This case overwrites case #${cancels.id} with reason \`${cancels.reason}\``})
            interaction.reply({embeds: [embed]});
        } else {
            // if caseid is user id, show their punishment history sorted by most recent.
            const user = (interaction.options.getUser('user') as Discord.User);
            if (user.bot) return interaction.reply(`<@${user.id}>'s punishment history cannot be viewed.`)
            const punishment = client.punishments._content.find((x:Punishment)=>x.member===user.id);
            if (!punishment) return interaction.reply(`<@${user.id}> has a clean record.`)
            const cancels = punishment.cancels ? client.punishments._content.find((x:Punishment)=>x.id==punishment.cancels) : null;
            const userPunishment = client.punishments._content.filter((x:Punishment)=>x.member==user.id).sort((a:Punishment,b:Punishment)=>a.time-b.time).map((punishment:Punishment)=>{
                return {
                    name: `${client.formatPunishmentType(punishment, client, cancels)} | Case #${punishment.id}`,
                    value: `Reason: \`${punishment.reason}\`\n${punishment.duration ? `Duration: ${client.formatTime(punishment.duration, 3)}\n` : ''}Moderator: <@${punishment.moderator}>${punishment.expired ? `\nOverwritten by case #${client.punishments._content.find((x:Punishment)=>x.cancels==punishment.id).id}` : ''}${punishment.cancels ? `\nOverwrites case #${punishment.cancels}` : ''}`
                }
            });
            // if caseid is not a punishment nor a user, failed
            if (!userPunishment || userPunishment.length == 0) return interaction.reply('No punishments found for that case # or User ID');

            const pageNum = interaction.options.getInteger('page') ?? 1;
            const embed = new client.embed().setColor(client.config.embedColor).setTitle(`${user.username}'s punishment history`).setDescription(`**ID:** \`${user.id}\``).setFooter({text: `${userPunishment.length} total punishments. Viewing page ${pageNum} out of ${Math.ceil(userPunishment.length/6)}.`}).addFields(userPunishment.slice((pageNum - 1) * 6, pageNum * 6));
            return interaction.reply({embeds: [embed]});
        }
	},
    data: new SlashCommandBuilder()
    .setName('case')
    .setDescription('Retrieve case information or user\'s punishment history')
    .addSubcommand((opt)=>opt
        .setName('view')
        .setDescription('View a single case.')
        .addIntegerOption((optt)=>optt
            .setName('id')
            .setDescription('Case #')
            .setRequired(true)))
    .addSubcommand((opt)=>opt
        .setName('member')
        .setDescription('View member\'s punishment history')
        .addUserOption((optt)=>optt
            .setName('user')
            .setDescription('Which user do you want to view their punishment history?')
            .setRequired(true))
        .addIntegerOption((optt)=>optt
            .setName('page')
            .setDescription('Select the page number')))
    .addSubcommand((opt)=>opt
        .setName('update')
        .setDescription('Update the case with new reason')
        .addIntegerOption((optt)=>optt
            .setName('id')
            .setDescription('Case # to be updated')
            .setRequired(true))
        .addStringOption((optt)=>optt
            .setName('reason')
            .setDescription('New reason for the case')
            .setRequired(true)))
};