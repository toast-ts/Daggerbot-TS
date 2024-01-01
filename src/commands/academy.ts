interface IArticles {
  articles: IArticleEmbed[];
}
interface IArticleEmbed {
  embed: {
    id:number; // Article ID (news_id)
    title:string;
    description:string;
  }
}
import yaml from 'yaml';
import Undici from 'undici';
import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
import {readFileSync, writeFileSync} from 'node:fs';
export default class Academy {
  private static yaml_file:IArticles = yaml.parse(readFileSync('src/articles.yaml', 'utf-8'));
  static async autocomplete(_client:TClient, interaction:Discord.AutocompleteInteraction<'raw'>) {
    const filterArray = this.yaml_file.articles.map(x=>x.embed.title).filter(x=>x.startsWith(interaction?.options.getFocused()));
    await interaction?.respond(filterArray.map(x=>({name: x, value: x})));
  }
  static async run(client:TClient, interaction:Discord.ChatInputCommandInteraction<'cached'>) {
    ({
      query: async()=>{
        const answer = interaction.options.getString('answer');
        const queryFound = this.yaml_file.articles.find(x=>x.embed.title === answer);
        interaction.reply({embeds: [new client.embed()
          .setColor(client.config.embedColor)
          .setTitle(queryFound.embed.title)
          .setURL(`https://www.farming-simulator.com/newsArticle.php?news_id=${queryFound.embed.id}`)
          .setDescription(queryFound.embed.description)
          .setFooter({text: 'This information is provided by the contributors with their best FS knowledge. If you find any mistakes, please contact Toast.'})
        ]});
      },
      how_to_contribute: ()=>interaction.reply({embeds: [new client.embed()
        .setColor(client.config.embedColor)
        .setTitle('How to contribute to the Academy')
        .setDescription(MessageTool.concatMessage(
          'If you want to show your support and contribute your knowledge to the academy command, you can do so by following the steps below:',
          '1. Create a [GitHub account](https://github.com/signup) if you haven\'t already',
          '2. Fork the [GitHub repository](https://github.com/AnxietyisReal/Daggerbot-TS/tree/master)',
          '3. Navigate to the `articles.yaml` file inside the `src` directory.',
          '4. Click the pencil icon to edit the file and add your article (**has to be closely related to official FSA article**) using the following format:',
          '```yaml',
          '- embed:',
          '    id: <article_id> # Article ID (/newsArticle.php?news_id=<article_id>)',
          '    title: <article_title> # Embed title and search term, don\'t make it too long',
          '    description: <article_description> # Embed description, limit is 4096 and multi-line is supported',
          '```',
        )).setFooter({text: 'Or if you\'re not familiar with GitHub, you can contact Toast directly with your article'})
      ]}),
      update: async()=>{
        if (!client.config.whitelist.includes(interaction.user.id)) return MessageTool.youNeedRole(interaction, 'bottech');
        const articles = await Undici.fetch('https://raw.githubusercontent.com/AnxietyisReal/Daggerbot-TS/master/src/articles.yml').then(x=>x.text());
        writeFileSync('src/articles.yml', articles, 'utf8');
        await interaction.reply({embeds: [new client.embed()
          .setColor(client.config.embedColorGreen)
          .setTitle('Academy file updated')
          .setDescription('The local file (`src/articles.yaml`) has been updated with the new information from the GitHub repository.')
        ]});
      }
    } as any)[interaction.options.getSubcommand()]();
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('academy')
    .setDescription('Provides useful information from Farming Simulator Academy')
    .addSubcommand(x=>x
      .setName('query')
      .setDescription('Queries the articles for given search term')
      .addStringOption(x=>x
        .setName('answer')
        .setDescription('The search term')
        .setRequired(true)
        .setAutocomplete(true)))
    .addSubcommand(x=>x
      .setName('how_to_contribute')
      .setDescription('Provides information on how to contribute to the academy command'))
    .addSubcommand(x=>x
      .setName('update')
      .setDescription('Updates the local file with new information from GitHub repository'))
}
