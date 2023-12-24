import Discord from 'discord.js';
import TClient from '../client.js';
import Punish from '../components/Punish.js';
export default class Warn {
  static run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    Punish(client, interaction, 'warn');
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(x=>x
      .setName('member')
      .setDescription('Which member to warn?')
      .setRequired(true))
    .addStringOption(x=>x
      .setName('reason')
      .setDescription('Reason for the warning'))
}
