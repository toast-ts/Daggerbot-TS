import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
export default class ProhibitedWords {
  static async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!MessageTool.isStaff(interaction.member)) return MessageTool.youNeedRole(interaction, 'admin');
    const word = interaction.options.getString('word');
    const wordExists = await client.prohibitedWords.findWord(word);
    ({
      view: async()=>{
        const pwList = await client.prohibitedWords.getAllWords();
        interaction.reply({
          ephemeral: true,
          content: `There are currently **${pwList.length}** words in the list`,
          files: [
            new client.attachment(Buffer.from(JSON.stringify(pwList.map(x=>x.dataValues.word), null, 2)), {name: 'pwDump.json'})
          ]
        })
      },
      add: async()=>{
        if (wordExists) return interaction.reply({ephemeral: true, content: `\`${word}\` already exists in the list`});
        else {
          await client.prohibitedWords.insertWord(word);
          interaction.reply({ephemeral: true, content: `Successfully added \`${word}\` to the list`});
        }
      },
      remove: async()=>{
        if (!wordExists) return interaction.reply({ephemeral: true, content: `\`${word}\` does not exist in the list`});
        else {
          await client.prohibitedWords.removeWord(word);
          interaction.reply({ephemeral: true, content: `Successfully removed \`${word}\` from the list`});
        }
      },
      import: async()=>{
        const file = interaction.options.getAttachment('file', true);
        if (!file.contentType.match(/application\/json/)) return interaction.reply({ephemeral: true, content: 'This file is not a JSON file!'});
        const success = await client.prohibitedWords.importWords(file.url);
        if (success) interaction.reply({ephemeral: true, content: `Successfully imported the list from \`${file.name}\` into the database`});
        else interaction.reply({ephemeral: true, content: `Failed to import the list from \`${file.name}\` into the database`});
      }
    } as any)[interaction.options.getSubcommand()]();
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('pw')
    .setDescription('Manage the database of prohibited words')
    .addSubcommand(x=>x
      .setName('view')
      .setDescription('View the list of currently banned words'))
    .addSubcommand(x=>x
      .setName('add')
      .setDescription('Add the word to the list')
        .addStringOption(x=>x
          .setName('word')
          .setDescription('Add the specific word to automod\'s prohibitedWords database')
          .setRequired(true)))
    .addSubcommand(x=>x
      .setName('remove')
      .setDescription('Remove the word from the list')
      .addStringOption(x=>x
        .setName('word')
        .setDescription('Remove the specific word from automod\'s prohibitedWords database')
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('import')
      .setDescription('Import a JSON file of words into the database')
      .addAttachmentOption(x=>x
        .setName('file')
        .setDescription('The JSON file to import')
        .setRequired(true)))
}
