import Discord,{SlashCommandBuilder} from 'discord.js';
import TClient from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        //if (!client.isStaff(interaction.member) && interaction.channelId == '468835415093411863') return interaction.reply('This command is restricted to staff only in this channel due to high usage.')
        const member = interaction.options.getMember('member') as Discord.GuildMember;
        const reason = interaction.options.getString('reason');
        const adminPerm = member.permissions.has('Administrator');

        if (adminPerm) return interaction.reply('You cannot bonk an admin!');
        
        await client.bonkCount._incrementUser(member.id).forceSave();
        const embed = new client.embed().setColor(client.config.embedColor)
            .setDescription(`> <@${member.id}> has been bonked!\n${reason?.length == null ? '' : `> Reason: **${reason}**`}`)
            .setImage('https://media.tenor.com/7tRddlNUNNcAAAAd/hammer-on-head-minions.gif')
            .setFooter({text: `Bonk count for ${member.user.tag}: ${await client.bonkCount.getUser(member.id).toLocaleString('en-US')}`})
        interaction.reply({embeds: [embed]});
    },
    data: new SlashCommandBuilder()
        .setName('bonk')
        .setDescription('Bonk a member')
        .addUserOption((opt)=>opt
            .setName('member')
            .setDescription('Which member to bonk?')
            .setRequired(true))
        .addStringOption((opt)=>opt
            .setName('reason')
            .setDescription('Reason for the bonk'))
}
