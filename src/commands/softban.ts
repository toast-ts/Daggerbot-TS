import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    client.punish(interaction, 'softban');
  },
  data: new Discord.SlashCommandBuilder()
  .setName('softban')
  .setDescription('Softban a member from the server')
  .addUserOption(x=>x
    .setName('member')
    .setDescription('Which member to softban?')
    .setRequired(true))
  .addStringOption(x=>x
    .setName('reason')
    .setDescription('Reason for the softban'))
}