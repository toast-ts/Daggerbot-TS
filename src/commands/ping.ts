import Discord from 'discord.js';
import TClient from '../client.js';
import {fetch} from 'undici';
import Formatters from '../helpers/Formatters.js';
export default class Ping {
  static async run(client:TClient, interaction:Discord.ChatInputCommandInteraction<'cached'>) {
    const expectedUptime:number = 16300;
    if (client.uptime < expectedUptime) return interaction.reply(`I just restarted, try again in <t:${Math.round((Date.now() + expectedUptime - client.uptime) / 1000)}:R>`);
    const timeOpt = {longNames: false, commas: true};
    const apiResp = (await fetch('https://discordstatus.com/metrics-display/5k2rt9f7pmny/day.json')).json();
    const msg = await interaction.reply({content: 'Pinging...', fetchReply: true});
    msg.edit({content: null, embeds:[new client.embed().setColor('#7e96fd').addFields(
      {name: 'Discord', value: Formatters.timeFormat(await apiResp.then((data:any)=>data.metrics[0].summary.mean.toFixed(0)), 3, timeOpt), inline: true},
      {name: 'WebSocket', value: Formatters.timeFormat(client.ws.ping, 3, timeOpt), inline: true}
    )]})
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check latency between bot and Discord API')
}
