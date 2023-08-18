import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (client.uptime < 15000) return interaction.reply('I just restarted, wait 15 seconds and try again.')
    const msg = await interaction.reply({content: 'Pinging...', fetchReply: true})
    msg.edit(`Websocket: \`${client.formatTime(client.ws.ping, 3, {longNames: false, commas: true})}\`\nBot: \`${client.formatTime(msg.createdTimestamp - interaction.createdTimestamp, 3, {longNames: false, commas: true})}\``)
  },
  data: new Discord.SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot\'s latency')
}