import Discord,{SlashCommandBuilder} from 'discord.js';
import TClient from 'src/client';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!client.isStaff(interaction.member) && !client.config.eval.whitelist.includes(interaction.member.id)) return client.youNeedRole(interaction, 'admin')
    const word = interaction.options.getString('word', true);
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
      //view: ()=>interaction.reply({content: 'Here is a complete list of banned words!\n*You can open it with a web browser, e.g Chrome/Firefox/Safari, or you can use Visual Studio Code/Notepad++*', files: ['src/database/bannedWords.json'], ephemeral: true})
    } as any)[interaction.options.getSubcommand()]();
  },
  data: new SlashCommandBuilder()
    .setName('bannedwords')
    .setDescription('description placeholder')/*
    .addSubcommand((opt)=>opt
      .setName('view')
      .setDescription('View the list of currently banned words.'))*/
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
