import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    const msg = await interaction.reply({content: 'Pinging...', fetchReply: true})
    const time = msg.createdTimestamp - interaction.createdTimestamp;
    msg.edit(`Websocket: \`${client.formatTime(client.ws.ping, 3, {longNames: false, commas: true})}\`\nBot: \`${client.formatTime(time, 3, {longNames: false, commas: true})}\``)
  },
  data: new Discord.SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot\'s latency')
}