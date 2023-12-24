import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
export default class Contributors {
  static run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Daggerbot contributors').setDescription(MessageTool.concatMessage(
      '**Thanks to those below that made their contributions to the bot!**',
      client.config.contribList.map(id=>`${interaction.guild.members.cache.get(id)?.user?.username ?? 'N/A'} <@${id}>`).join('\n')))]})
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('contributors')
    .setDescription('List of people who contributed to the bot')
}
