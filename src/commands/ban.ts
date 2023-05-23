import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    client.punish(interaction, 'ban');
  },
  data: new Discord.SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(x=>x
      .setName('member')
      .setDescription('Which member to ban?')
      .setRequired(true))
    .addStringOption(x=>x
      .setName('time')
      .setDescription('How long the ban will be?'))
    .addStringOption(x=>x
      .setName('reason')
      .setDescription('Reason for the ban'))
}