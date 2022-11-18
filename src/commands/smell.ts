import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        const embed = new client.embed().setColor(client.config.embedColor).setTitle('Who smells?').setDescription('Dave and Monster! (Monster smells of staircases)').setImage('https://media.tenor.com/QW9S-Oq9INQAAAAC/patrick-smell.gif')
        interaction.reply({embeds: [embed]});
    },
    data: new SlashCommandBuilder()
        .setName('smell')
        .setDescription('Who smells?')
}