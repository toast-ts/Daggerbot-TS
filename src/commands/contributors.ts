import Discord,{SlashCommandBuilder} from 'discord.js';
import TClient from '../client.js';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Daggerbot contributors').setDescription([
      '**Thanks to those below that contributed to/developed the bot!**',
      client.config.whitelist.map(id=>{const member = interaction.guild.members.cache.get(id); return `${member?.user?.username ?? 'N/A'} <@${id}>`}).join('\n')
    ].join('\n'))]})
  },
  data: new SlashCommandBuilder()
    .setName('contributors')
    .setDescription('List of people who contributed to the bot')
}