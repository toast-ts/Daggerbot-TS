import Discord from 'discord.js';
import TClient from '../client.js';
export default class Tag {
  static async autocomplete(client:TClient, interaction:Discord.AutocompleteInteraction<'cached'>) {
    const tagsInCache = await client.tags?.findInCache();
    const filterArray = tagsInCache?.map(x=>x.tagname).filter(x=>x.startsWith(interaction.options.getFocused()));
    await interaction?.respond(filterArray?.map(tag=>({name: tag, value: tag})));
  }
  static async run(client:TClient, interaction:Discord.ChatInputCommandInteraction<'cached'>) {
    const tagName = interaction.options.getString('tag-name');
    const tagMsg = interaction.options.getString('message');
    ({
      send: async()=>await client.tags.sendTag(interaction, tagName, interaction.options.getMember('target')?.id),
      create: async()=>{
        const newTag = await client.tags.createTag(interaction.member.id, tagName, tagMsg, interaction.options.getBoolean('toggle-embed'));
        await interaction.reply(newTag ? 'Tag successfully created, should be available in the list soon!' : 'Tag already exists, try again with a different name.');
      },
      delete: async()=>{
        await client.tags.deleteTag(tagName);
        return interaction.reply('Tag successfully deleted.');
      },
      modify: async()=>{
        await client.tags.modifyTag(tagName, interaction.options.getString('new-message'));
        return interaction.reply('Tag successfully modified.')
      }
    } as any)[interaction.options.getSubcommand() ?? interaction.options.getSubcommandGroup()]();
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('tag')
    .setDescription('Send a tag containing the resources/FAQ provided in tag to the user')
    .addSubcommand(x=>x
      .setName('send')
      .setDescription('Send a resource tag')
      .addStringOption(x=>x
        .setName('tag-name')
        .setDescription('Name of an existing tag to send')
        .setAutocomplete(true)
        .setRequired(true))
      .addUserOption(x=>x
        .setName('target')
        .setDescription('Directly mention the member with this tag')
        .setRequired(false)))
    .addSubcommandGroup(x=>x
      .setName('tools')
      .setDescription('Management tools for the tags system (Discord mods & bot devs only)')
      .addSubcommand(x=>x
        .setName('create')
        .setDescription('Create a new tag')
        .addStringOption(x=>x
          .setName('tag-name')
          .setDescription('Name of the tag, must be within 4-32 characters')
          .setMinLength(4)
          .setMaxLength(32)
          .setRequired(true))
        .addStringOption(x=>x
          .setName('message')
          .setDescription('Message to be included in your tag, newline: \\n')
          .setMaxLength(1990)
          .setRequired(true))
        .addBooleanOption(x=>x
          .setName('toggle-embed')
          .setDescription('Message will be sent in an embed description if enabled')
          .setRequired(true)))
      .addSubcommand(x=>x
        .setName('delete')
        .setDescription('Delete an existing tag')
        .addStringOption(x=>x
          .setName('tag-name')
          .setDescription('Name of the tag to be deleted')
          .setAutocomplete(true)
          .setRequired(true)))
      .addSubcommand(x=>x
        .setName('modify')
        .setDescription('Modify an existing tag')
        .addStringOption(x=>x
          .setName('tag-name')
          .setDescription('Name of the tag to be modified')
          .setAutocomplete(true)
          .setRequired(true))
        .addStringOption(x=>x
          .setName('new-message')
          .setDescription('Replace the current tag\'s message with a new one, newline: \\n')
          .setMaxLength(1990)
          .setRequired(true))))
}
