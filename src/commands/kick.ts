import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    client.punish(interaction, 'kick');
  },
  data: new Discord.SlashCommandBuilder()
    .setName('kick')
    .setDescription('Boot a member from the server')
    .addUserOption(x=>x
      .setName('member')
      .setDescription('Which member to kick?')
      .setRequired(true))
    .addStringOption(x=>x
      .setName('reason')
      .setDescription('Reason for the kick'))
}