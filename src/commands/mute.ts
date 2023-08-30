import Discord from 'discord.js';
import TClient from '../client.js';
import Punish from '../funcs/Punish.js';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    Punish(client, interaction, 'mute');
  },
  data: new Discord.SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a member')
    .addUserOption(x=>x
      .setName('member')
      .setDescription('Which member to mute?')
      .setRequired(true))
    .addStringOption(x=>x
      .setName('time')
      .setDescription('Mute duration'))
    .addStringOption(x=>x
      .setName('reason')
      .setDescription('Reason for the mute'))
}