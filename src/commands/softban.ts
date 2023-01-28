import Discord,{SlashCommandBuilder} from 'discord.js';
import TClient from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        client.punish(client, interaction, 'softban');
    },
    data: new SlashCommandBuilder()
        .setName('softban')
        .setDescription('Softban a member from the server')
        .addUserOption((opt)=>opt
            .setName('member')
            .setDescription('Which member to softban?')
            .setRequired(true))
        .addStringOption((opt)=>opt
            .setName('reason')
            .setDescription('Reason for the softban'))
}