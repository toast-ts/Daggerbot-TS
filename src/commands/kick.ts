import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        client.punish(client, interaction, 'kick');
    },
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Boot a member from the server')
        .setDMPermission(false)
        .addUserOption((opt)=>opt
            .setName('member')
            .setDescription('Which member to kick?')
            .setRequired(true))
        .addStringOption((opt)=>opt
            .setName('reason')
            .setDescription('Reason for the kick'))
}