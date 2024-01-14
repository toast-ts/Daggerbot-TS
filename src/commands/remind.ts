import Discord from 'discord.js';
import TClient from '../client.js';
import Punish from '../components/Punish.js';
export default class Remind {
  static run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    Punish(client, interaction, 'remind');
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('remind')
    .setDescription('Remind a member that they\'re breaking the rules')
    .addUserOption(x=>x
      .setName('member')
      .setDescription('Which member to remind?')
      .setRequired(true))
    .addStringOption(x=>x
      .setName('reason')
      .setDescription('Reason for the reminder'))
}
