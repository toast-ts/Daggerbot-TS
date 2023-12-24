import Discord from 'discord.js';
import TClient from '../client.js';
export default class Bonk {
  static async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    //if (!client.isStaff(interaction.member) && interaction.channelId == '468835415093411863') return interaction.reply('This command is restricted to staff only in this channel due to high usage.')
    const member = interaction.options.getMember('member') as Discord.GuildMember;
    const reason = interaction.options.getString('reason');
    if (member.permissions.has('Administrator')) return interaction.reply('You cannot bonk an admin!');

    await client.bonkCount.hitCountIncremental(member.id);
    interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor)
      .setDescription(`> <@${member.id}> has been bonked!\n${reason?.length == null ? '' : `> Reason: **${reason}**`}`)
      .setImage('https://media.tenor.com/7tRddlNUNNcAAAAd/hammer-on-head-minions.gif')
      .setFooter({text: `Bonk count for ${member.displayName}: ${await client.bonkCount.fetchUser(member.id).then(x=>x.count)}`})
    ]})
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('bonk')
    .setDescription('Bonk a member')
    .addUserOption(x=>x
      .setName('member')
      .setDescription('Which member to bonk?')
      .setRequired(true))
    .addStringOption(x=>x
      .setName('reason')
      .setDescription('Reason for the bonk'))
}
