import Discord,{SlashCommandBuilder} from 'discord.js';
import TClient from 'src/client';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    client.punish(client, interaction, 'warn');
  },
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption((opt)=>opt
      .setName('member')
      .setDescription('Which member to warn?')
      .setRequired(true))
    .addStringOption((opt)=>opt
      .setName('reason')
      .setDescription('Reason for the warning')
      .setRequired(false))
}