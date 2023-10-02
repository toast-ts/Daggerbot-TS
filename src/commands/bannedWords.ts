import Discord from 'discord.js';
import TClient from '../client.js';
import {writeFileSync} from 'node:fs';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!client.isStaff(interaction.member) && !client.config.whitelist.includes(interaction.member.id)) return client.youNeedRole(interaction, 'admin')
    const word = interaction.options.getString('word');
    const wordExists = await client.bannedWords._content.findById(word);
    ({
      add: async()=>{
        if (wordExists) return interaction.reply({content: `\`${word}\` is already added.`, ephemeral: true});
        await client.bannedWords._content.create({_id:word}).then(a=>a.save()).catch(e=>{if (e.name == 'No document found for query') return});
        interaction.reply(`Successfully added \`${word}\` to the database.`)
      },
      remove: async()=>{
        if (!wordExists) return interaction.reply({content: `\`${word}\` doesn't exist on the list.`, ephemeral: true});
        await client.bannedWords._content.findOneAndDelete({_id:word});
        interaction.reply(`Successfully removed \`${word}\` from the database.`)
      },
      view: async()=>{
        const findAll = await client.bannedWords.findInCache();
        writeFileSync('src/database/bw_dump.json', JSON.stringify(findAll.map(i=>i._id), null, 2), {encoding: 'utf8', flag: 'w+'});
        interaction.reply({content: 'Here\'s the dump file from the database.', files: ['src/database/bw_dump.json'], ephemeral: true}).catch(err=>interaction.reply({content: `Ran into an error, notify <@&${client.config.mainServer.roles.bottech}> if it happens again:\n\`${err.message}\``, ephemeral: true}))
      }
    } as any)[interaction.options.getSubcommand()]();
  },
  data: new Discord.SlashCommandBuilder()
    .setName('bannedwords')
    .setDescription('description placeholder')
    .addSubcommand(x=>x
      .setName('view')
      .setDescription('View the list of currently banned words'))
    .addSubcommand(x=>x
      .setName('add')
      .setDescription('Add the word to the list')
        .addStringOption(x=>x
          .setName('word')
          .setDescription('Add the specific word to automod\'s bannedWords database')
          .setRequired(true)))
    .addSubcommand(x=>x
      .setName('remove')
      .setDescription('Remove the word from the list')
      .addStringOption(x=>x
        .setName('word')
        .setDescription('Remove the specific word from automod\'s bannedWords list')
        .setRequired(true)))
}
