import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
import FormatTime from '../helpers/FormatTime.js';

export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    const now = Date.now();
    const exp = interaction.options.getString('expression', true).replace(/[^-()\d/*+.]/g, '');
    try {
      const result = eval(exp);
      switch (exp) {
        case '1+1':
          return interaction.reply('2, quick maths.');
        case '2+2':
          return interaction.reply('2+2 is 4, minus 1 that\'s 3, quick maths.');
        case '0/0':
          return interaction.reply(MessageTool.concatMessage(
            'Imagine that you have zero cookies and you split them evenly among zero friends.',
            'How many cookies does each person get? See? It doesn\'t make sense.',
            'And Cookie Monster is sad that there are no cookies, and you are sad that you have no friends.',
            '-- Siri, 2015'
          ));
      };
      interaction.reply({embeds:[new client.embed().setColor(client.config.embedColor).addFields({name: 'Expression', value: `\`\`\`js\n${exp}\n\`\`\``},{name: 'Answer', value: `\`\`\`js\n${result}\n\`\`\``}).setFooter({text: `Time taken: ${FormatTime(Date.now() - now, 3)}`})]})
    } catch {
      interaction.reply('The given expression is invalid.');
    }
  },
  data: new Discord.SlashCommandBuilder()
    .setName('calculator')
    .setDescription('Calculate a math expression or simple 2+2')
    .addStringOption(x=>x
      .setName('expression')
      .setDescription('The expression to be calculated')
      .setRequired(true))
}
