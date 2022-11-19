import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        if (!client.isStaff(interaction.member) && !client.config.eval.whitelist.includes(interaction.member.id)) return client.youNeedRole(interaction, 'dcmod')
        const word = interaction.options.getString('word');
        if (client.bannedWords._content.includes(word)) return interaction.reply({content: 'That word is already added to the list.', ephemeral: true});
        client.bannedWords.addData(word).forceSave();
        interaction.reply(`Successfully added \`${word}\` to the list.`)
    },
    data: new SlashCommandBuilder()
        .setName('addbannedword')
        .setDescription('Add a word to bannedWords file')
        .addStringOption((opt)=>opt
            .setName('word')
            .setDescription('What word do you want automod to ban?')
            .setRequired(true))
}