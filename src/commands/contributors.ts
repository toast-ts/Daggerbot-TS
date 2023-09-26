import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Daggerbot contributors').setDescription(MessageTool.concatMessage(
      '**Thanks to those below that contributed to/developed the bot!**',
      client.config.contribList.map(id=>{
        const member = interaction.guild.members.cache.get(id);
        return `${member?.user?.username ?? 'N/A'} <@${id}>`}
      ).join('\n')))]})
  },
  data: new Discord.SlashCommandBuilder()
    .setName('contributors')
    .setDescription('List of people who contributed to the bot')
}