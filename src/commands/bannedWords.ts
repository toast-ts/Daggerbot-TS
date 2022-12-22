import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        if (!client.isStaff(interaction.member) && !client.config.eval.whitelist.includes(interaction.member.id)) return client.youNeedRole(interaction, 'admin')
        const Sub = interaction.options.getSubcommand();
        const word = interaction.options.getString('word');
        switch(Sub){
            case 'view':
                interaction.reply({content: 'Here is a complete list of banned words!\n*You can open it with a web browser, e.g Chrome/Firefox/Safari, or you can use Visual Studio Code/Notepad++*', files: ['src/database/bannedWords.json'], ephemeral: true})
                break;
            case 'add':
                if (client.bannedWords._content.includes(word)) return interaction.reply({content: `\`${word}\` is already added.`, ephemeral: true});
                client.bannedWords.addData(word).forceSave();
                interaction.reply(`Successfully added \`${word}\` to the list.`)
                break;
            case 'remove':
                if (client.bannedWords._content.includes(!word)) return interaction.reply({content: `\`${word}\` doesn't exist on the list.`, ephemeral: true});
                client.bannedWords.removeData(word, 1, 0).forceSave();
                interaction.reply(`Successfully removed \`${word}\` from the list.`)
        }
    },
    data: new SlashCommandBuilder()
        .setName('bannedwords')
        .setDescription('description placeholder')
        .setDMPermission(false)
        .addSubcommand((opt)=>opt
            .setName('view')
            .setDescription('View the list of currently banned words.'))
        .addSubcommand((opt)=>opt
            .setName('add')
            .setDescription('What word do you want to add?')
            .addStringOption((optt)=>optt
                .setName('word')
                .setDescription('Add the specific word to automod\'s bannedWords list.')
                .setRequired(true)))
        .addSubcommand((opt)=>opt
            .setName('remove')
            .setDescription('What word do you want to remove?')
            .addStringOption((optt)=>optt
                .setName('word')
                .setDescription('Remove the specific word from automod\'s bannedWords list.')
                .setRequired(true)))
}
