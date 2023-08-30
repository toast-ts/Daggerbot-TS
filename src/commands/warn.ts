import Discord from 'discord.js';
import TClient from '../client.js';
import Punish from '../funcs/Punish.js';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    Punish(client, interaction, 'warn');
  },
  data: new Discord.SlashCommandBuilder()
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