import Discord,{SlashCommandBuilder} from 'discord.js';
import TClient from 'src/client';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    client.punish(client, interaction, 'ban');
  },
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption((opt)=>opt
      .setName('member')
      .setDescription('Which member to ban?')
      .setRequired(true))
    .addStringOption((opt)=>opt
      .setName('time')
      .setDescription('How long the ban will be?'))
    .addStringOption((opt)=>opt
      .setName('reason')
      .setDescription('Reason for the ban'))
}