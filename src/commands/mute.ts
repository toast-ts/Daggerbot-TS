import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        client.punish(client, interaction, 'mute');
    },
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a member')
        .addUserOption((opt)=>opt
            .setName('member')
            .setDescription('Which member to mute?')
            .setRequired(true))
        .addStringOption((opt)=>opt
            .setName('time')
            .setDescription('Mute duration'))
        .addStringOption((opt)=>opt
            .setName('reason')
            .setDescription('Reason for the mute'))
}