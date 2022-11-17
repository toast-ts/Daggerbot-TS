import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        if (!client.isStaff(interaction.member) && interaction.channelId == '468835415093411863') return interaction.reply('This command is restricted to staff only in this channel due to high usage.')
        const member = interaction.options.getUser('member');
        const reason = interaction.options.getString('reason');
        const adminPerm = interaction.member.permissions.has('Administrator')
        if (!member) {
            return interaction.reply('You can\'t bonk the ghost.')
        } else {
            //if (member && adminPerm) return interaction.reply('You cannot bonk an admin!')
            if (member) {
                const embed = new client.embed().setColor(client.config.embedColor)
                .setDescription(`> <@${member.id}> has been bonked!\n${reason?.length == null ? '' : `> Reason: ${reason}`}`)
                .setImage('https://media.tenor.com/7tRddlNUNNcAAAAd/hammer-on-head-minions.gif')
                .setFooter({text: `Bonk count for ${member.tag}: ${await client.bonkCount.getUser(member.id).toLocaleString('en-US')}`})
            interaction.reply({embeds: [embed]})
            client.bonkCount._incrementUser(member.id).forceSave();
            }
        }
    },
    data: new SlashCommandBuilder()
        .setName('bonk')
        .setDescription('Bonk a member')
        .addUserOption((opt)=>opt
            .setName('member')
            .setDescription('Which member to bonk?'))
        .addStringOption((opt)=>opt
            .setName('reason')
            .setDescription('Reason for the bonk'))
}