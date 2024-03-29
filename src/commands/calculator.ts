import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
import Formatters from '../helpers/Formatters.js';
import * as math from 'mathjs';// I hate this, but it doesn't provide a default export though :cimpCopium:

export default class Calculator {
  static run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    const now = Date.now();
    const exp = interaction.options.getString('expression', true).replace(/[^-()\d/*+.]/g, '');
    try {
      let result:math.EvalFunction;
      switch (exp) {
        case '1+1':
          return interaction.reply('Wh-why are you doing this? I mean... **1+1** is **2**, but... *why?*');
        case '2+2':
          return interaction.reply('https://c.tenor.com/5-bc8MtSWCYAAAAC/tenor.gif');
        case '2+2-1':
        case '1-2+2':
          return interaction.reply('https://tenor.com/bhI9r.gif');
        case '0/0':
          return interaction.reply(MessageTool.concatMessage(
            'Imagine that you have zero cookies and you split them evenly among zero friends.',
            'How many cookies does each person get? See? It doesn\'t make sense.',
            'And Cookie Monster is sad that there are no cookies, and you are sad that you have no friends.',
            '-- Siri, 2015'
          ));
        default:
          result = math.evaluate(exp);
          break;
      }
      if (typeof result !== 'undefined') interaction.reply({embeds:[new client.embed().setColor(client.config.embedColor).addFields({name: 'Expression', value: `\`\`\`js\n${exp}\n\`\`\``},{name: 'Answer', value: `\`\`\`js\n${result}\n\`\`\``}).setFooter({text: `Time taken: ${Formatters.timeFormat(Date.now() - now, 3)}`})]})
    } catch {
      interaction.reply('The given expression is invalid.');
    }
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('calculator')
    .setDescription('Calculate a math expression or simple 2+2')
    .addStringOption(x=>x
      .setName('expression')
      .setDescription('The expression to be calculated')
      .setRequired(true))
}
