import Discord,{SlashCommandBuilder} from 'discord.js';
import TClient from 'src/client';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Daggerbot contributors').setDescription([
      '**Thanks to those below that contributed to the bot!**',
      'Toast <@190407856527376384>',
      'TÆMBØ <@615761944154210305>',
      'Buzz <@593696856165449749>',
      'Monster <@215497515934416896>',
      'RainbowDave <@141304507249197057>',
      'Hitchhiker <@506022868157595648>',
      'RedRover92 <@633345781780185099>',
      'Nawdic <@178941218510602240>'
    ].join('\n'))]})
  },
  data: new SlashCommandBuilder()
    .setName('contributors')
    .setDescription('List of people who contributed to the bot.')
}