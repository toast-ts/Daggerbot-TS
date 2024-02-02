import Discord from 'discord.js';
import TClient from '../client.js';
import HookMgr from '../components/HookManager.js';
import MessageTool from '../helpers/MessageTool.js';
export default class ProhibitedWords {
  static async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!MessageTool.isModerator(interaction.member) && !client.config.whitelist.includes(interaction.member.id)) return MessageTool.youNeedRole(interaction, 'admin');
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
          interaction.reply({ephemeral: true, content: `Successfully added \`${word}\` to the prohibited words list`});
          await this.notify(client, {
            embeds: [new client.embed()
              .setColor(client.config.embedColorGreen)
              .setDescription(`**${interaction.user.tag}** has added \`${word}\` to the list`)
              .setFooter({text: `Total: ${(await client.prohibitedWords.getAllWords()).length}`})
              .setAuthor({name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({size: 2048})})
            ]
          });
        }
      },
      remove: async()=>{
        if (!wordExists) return interaction.reply({ephemeral: true, content: `\`${word}\` does not exist in the list`});
        else {
          await client.prohibitedWords.removeWord(word);
          interaction.reply({ephemeral: true, content: `Successfully removed \`${word}\` from the prohibited words list`});
          await this.notify(client, {
            embeds: [new client.embed()
              .setColor(client.config.embedColorRed)
              .setDescription(`**${interaction.user.tag}** has removed \`${word}\` from the list`)
              .setFooter({text: `Total: ${(await client.prohibitedWords.getAllWords()).length}`})
              .setAuthor({name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({size: 2048})})
            ]
          });
        }
      }
    } as any)[interaction.options.getSubcommand()]();
  }
  private static async notify(client:TClient, message:Discord.MessageCreateOptions) {
    return new HookMgr(client, 'pw_list', '1193424631059714128').send(message);
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
}
