import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  async autocomplete(client: TClient, interaction: Discord.AutocompleteInteraction){
    const array = (await client.tags?._content.find())?.map(x=>x._id).filter(c=>c.startsWith(interaction.options.getFocused()));
    await interaction?.respond(array?.map(c=>({name: c, value: c})));
    // If you question all those '?.', let me tell you: Discord.JS is fricking stupid and I am too stressed to find a solution for it.
  },
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!client.isStaff(interaction.member) && !client.config.whitelist.includes(interaction.member.id)) return client.youNeedRole(interaction, 'dcmod');
    const tagData = async()=>await client.tags._content.findOne({_id: interaction.options.getString('name')});
    const tagMeta = {
      isEmbedTrue: async()=>(await tagData()).embedBool,
      title: async()=>(await tagData())._id,
      message: async()=>(await tagData()).message,
      creatorName: async()=>(await client.users.fetch((await tagData()).user._id)).displayName
    };
    ({
      send: async()=>{
        let targetField = '';
        const targetMember = interaction.options.getMember('target_user');
        if (targetMember) targetField = `*This tag is for <@${targetMember.id}>*`;
        //console.log(targetMember)
        const embedTemplate = new client.embed().setColor(client.config.embedColor).setTitle(await tagMeta.title()).setDescription(await tagMeta.message()).setFooter({text: `Tag creator: ${await tagMeta.creatorName()}`});
        const messageTemplate = [
          targetField ? targetField : '',
          `**${await tagMeta.title()}**`,
          await tagMeta.message(),
          '',
          `Tag creator: **${await tagMeta.creatorName()}**`
        ].join('\n');
        if (await tagMeta.isEmbedTrue()) return interaction.reply({content: targetField ? targetField : null, embeds: [embedTemplate], allowedMentions:{parse:['users']}});
        else return interaction.reply({content: messageTemplate, allowedMentions:{parse:['users']}})
      },
      create: async()=>await client.tags._content.create({
          _id: interaction.options.getString('name'),
          message: interaction.options.getString('message'),
          embedBool: interaction.options.getBoolean('embed'),
          user: {
            _id: interaction.member.id,
            name: interaction.user.username
          }
        })
        .then(()=>interaction.reply('Tag is now created and available to use.'))
        .catch(err=>interaction.reply(`There was an error while trying to create your tag:\n\`\`\`${err}\`\`\``)),
      delete: async()=>await client.tags._content.findByIdAndDelete(interaction.options.getString('name')).then(()=>interaction.reply('Tag successfully deleted.')).catch(err=>interaction.reply(`Failed to delete the tag:\n\`\`\`${err}\`\`\``)),
      edit: async()=>await client.tags._content.findByIdAndUpdate(interaction.options.getString('name'), {
          $set: {
            message: interaction.options.getString('new-message'),
            embedBool: interaction.options.getBoolean('embed')
          }
        })
        .then(()=>interaction.reply('Tag successfully updated, enjoy!'))
        .catch(err=>interaction.reply(`Tag couldn\'t be updated:\n\`\`\`${err}\`\`\``))
    } as any)[interaction.options.getSubcommand() ?? interaction.options.getSubcommandGroup()]();
  },
  data: new Discord.SlashCommandBuilder()
    .setName('tag')
    .setDescription('Send user the resources/FAQ provided in the tag')
    .addSubcommand(x=>x
      .setName('send')
      .setDescription('Send a resource tag')
      .addStringOption(x=>x
        .setName('name')
        .setDescription('Name of an existing tag to send')
        .setAutocomplete(true)
        .setRequired(true))
      .addUserOption(x=>x
        .setName('target_user')
        .setDescription('Directly mention the target with this tag')))
    .addSubcommandGroup(x=>x
      .setName('management')
      .setDescription('Add a new tag or delete/edit your current tag')
      .addSubcommand(x=>x
        .setName('create')
        .setDescription('Create a new tag')
        .addStringOption(x=>x
          .setName('name')
          .setDescription('Name of your tag, must be within 3-25 characters')
          .setMinLength(3)
          .setMaxLength(25)
          .setRequired(true))
        .addStringOption(x=>x
          .setName('message')
          .setDescription('Message to be included in your tag; e.g, you\'re giving the user some instructions')
          .setMinLength(6)
          .setMaxLength(2048)
          .setRequired(true))
        .addBooleanOption(x=>x
          .setName('embed')
          .setDescription('Toggle this option if you want your message to be inside the embed or not')
          .setRequired(true)))
      .addSubcommand(x=>x
        .setName('delete')
        .setDescription('Delete a tag')
        .addStringOption(x=>x
          .setName('name')
          .setDescription('Name of the tag to be deleted')
          .setAutocomplete(true)
          .setRequired(true)))
      .addSubcommand(x=>x
        .setName('edit')
        .setDescription('Edit an existing tag')
        .addStringOption(x=>x
          .setName('name')
          .setDescription('Name of the tag to be edited')
          .setAutocomplete(true)
          .setRequired(true))
        .addStringOption(x=>x
          .setName('new-message')
          .setDescription('Replace the current tag\'s message with a new one')
          .setRequired(true))
        .addBooleanOption(x=>x
          .setName('embed')
          .setDescription('Toggle this option on an existing tag to be updated with embed or not')
          .setRequired(true))))
}

// createTag
/*if (interaction.options.getString('name') === await tagMeta.tagTitle()) return interaction.reply('This tag already exists!');
        else {
          await client.tags._content.create({
            _id: interaction.options.getString('name'),
            message: interaction.options.getString('message'),
            embedBool: interaction.options.getBoolean('embed'),
            user: {
              _id: interaction.member.id,
              name: interaction.user.username
            }
          })
          .then(()=>interaction.reply('Tag is now created and available to use.'))
          .catch(err=>interaction.reply(`There was an error while trying to create your tag:\n\`\`\`${err}\`\`\``))
        }*/