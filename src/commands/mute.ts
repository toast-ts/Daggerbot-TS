import Discord from 'discord.js';
import TClient from '../client.js';
import Punish from '../components/Punish.js';
export default class Mute {
  static run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    Punish(client, interaction, 'mute');
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a member')
    .addUserOption(x=>x
      .setName('member')
      .setDescription('Which member to mute?')
      .setRequired(true))
    .addStringOption(x=>x
      .setName('time')
      .setDescription('How long the mute last?'))
    .addStringOption(x=>x
      .setName('reason')
      .setDescription('Reason for the mute'))
}
