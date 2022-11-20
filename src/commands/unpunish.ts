import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        client.unPunish(client, interaction)
    },
    data: new SlashCommandBuilder()
        .setName('unpunish')
        .setDescription('Remove the active punishment from a member')
        .addIntegerOption((opt)=>opt
            .setName('case_id')
            .setDescription('Case # of the punishment to be overwritten')
            .setRequired(true))
        .addStringOption((opt)=>opt
            .setName('reason')
            .setDescription('Reason for removing the punishment'))
}