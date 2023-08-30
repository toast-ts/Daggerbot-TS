import Discord from 'discord.js';
import TClient from '../client.js';
import FormatTime from '../helpers/FormatTime.js';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (client.uptime < 15500) return interaction.reply('I just restarted, wait 15 seconds and try again.')
    const msg = await interaction.reply({content: 'Pinging...', fetchReply: true})
    msg.edit(`API Latency: \`${FormatTime(client.ws.ping, 3, {longNames: false, commas: true})}\`\nBot Latency: \`${FormatTime(msg.createdTimestamp - interaction.createdTimestamp, 3, {longNames: false, commas: true})}\``)
  },
  data: new Discord.SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check latency between bot and Discord API')
}
