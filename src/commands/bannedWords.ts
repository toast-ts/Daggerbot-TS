import Discord,{SlashCommandBuilder} from 'discord.js';
import TClient from 'src/client';
import {writeFileSync} from 'node:fs';
import path from 'node:path';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!client.isStaff(interaction.member) && !client.config.eval.whitelist.includes(interaction.member.id)) return client.youNeedRole(interaction, 'admin')
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
        const findAll = await client.bannedWords._content.find({});
        writeFileSync(path.join(__dirname, '../database/bw_dump.json'), JSON.stringify(findAll.map(i=>i._id), null, 2), {encoding: 'utf8', flag: 'w+'});
        interaction.reply({content: 'Here\'s the dump file from the database.', files: ['src/database/bw_dump.json'], ephemeral: true}).catch(err=>interaction.reply({content: `Ran into an error, notify <@&${client.config.mainServer.roles.bottech}> if it happens again:\n\`${err.message}\``, ephemeral: true}))
      }
    } as any)[interaction.options.getSubcommand()]();
  },
  data: new SlashCommandBuilder()
    .setName('bannedwords')
    .setDescription('description placeholder')
    .addSubcommand((opt)=>opt
      .setName('view')
      .setDescription('View the list of currently banned words.'))
    .addSubcommand((opt)=>opt
      .setName('add')
      .setDescription('What word do you want to add?')
        .addStringOption((optt)=>optt
          .setName('word')
          .setDescription('Add the specific word to automod\'s bannedWords database.')
          .setRequired(true)))
    .addSubcommand((opt)=>opt
      .setName('remove')
      .setDescription('What word do you want to remove?')
      .addStringOption((optt)=>optt
        .setName('word')
        .setDescription('Remove the specific word from automod\'s bannedWords list.')
        .setRequired(true)))
}
