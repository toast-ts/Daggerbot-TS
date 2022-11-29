import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        const msg = await interaction.reply({content: 'Pinging...', fetchReply: true})
        const time = msg.createdTimestamp - interaction.createdTimestamp;
        msg.edit(`Websocket: \`${client.ws.ping}\`ms\nBot: \`${time}\`ms`)
    },
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot\'s latency')
        .setDMPermission(false)
}