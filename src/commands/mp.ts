import Discord from 'discord.js';
import TClient from '../client.js';
import path from 'node:path';
import canvas from 'canvas';
import {readFileSync} from 'node:fs';

export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    async function hitEndpoint(){
      const array = (await client.MPServer?._content.find())?.map(x=>x._id).filter(c=>['mainServer','secondServer'].includes(c));
      console.log(array?.map(c=>c));

      /* const database = {
        mainServer: (await client.MPServer._content.findById(interaction.guildId)).mainServer,
        secondServer: (await client.MPServer._content.findById(interaction.guildId)).secondServer
      }
      const endpoint = '/feed/dedicated-server-stats.json?code=';
      if (serverSelector === 'mainServer') return database.mainServer.ip+endpoint+database.mainServer.code;
      else if (serverSelector === 'secondServer') return database.secondServer.ip+endpoint+database.secondServer.code;
      const Server = await client.axios.get(serverSelector, {
        timeout: 7500,
        headers: {'User-Agent':`Daggerbot - mp cmd/axios ${client.axios.VERSION}`}
      }) */
    }
    
    if (interaction.channelId === '468835769092669461' && !client.isStaff(interaction.member) && ['status', 'players'].includes(interaction.options.getSubcommand())) {
      interaction.reply(`Please use <#739084625862852715> for \`/mp status/players\` commands to prevent clutter in this channel.`).then(()=>setTimeout(()=>interaction.deleteReply(), 6000));
      return;
    }
    ({
      status: async()=>{
        hitEndpoint()
        interaction.reply('x')
      },
      info: async()=>{},
      url: async()=>{},
      players: async()=>{}
    } as any)[interaction.options.getSubcommand()]();
  },
  data: new Discord.SlashCommandBuilder()
  .setName('mp')
  .setDescription('Display MP status and other things')
  .addSubcommand(x=>x
    .setName('status')
    .setDescription('Check server status and details')
    .addStringOption(x=>x
      .setName('server')
      .setDescription('Which server to pull info from')
      .setChoices(
        {name: 'Main Server', value: 'mainServer'},
        {name: 'Second Server', value: 'secondServer'})
      .setRequired(true)))
  .addSubcommand(x=>x
    .setName('players')
    .setDescription('Check who\'s playing on the server')
    .addStringOption(x=>x
      .setName('server')
      .setDescription('Which server to pull the info from')
      .setChoices(
        {name: 'Main Server', value: 'mainServer'},
        {name: 'Second Server', value: 'secondServer'})
      .setRequired(true)))
  .addSubcommand(x=>x
    .setName('info')
    .setDescription('Provides you with server information such as filters and so on')
    .addStringOption(x=>x
      .setName('server')
      .setDescription('Which server to pull the info from')
      .setChoices(
        {name: 'Main Server', value: 'mainServer'},
        {name: 'Second Server', value: 'secondServer'})
      .setRequired(true)))
  .addSubcommand(x=>x
    .setName('url')
    .setDescription('View the URL for this server\'s FSMP server or update the URL')
    .addStringOption(x=>x
      .setName('server')
      .setDescription('Which server to view/update the URL')
      .setChoices(
        {name: 'Main Server', value: 'mainServer'},
        {name: 'Second Server', value: 'secondServer'})
      .setRequired(true))
    .addStringOption(x=>x
      .setName('address')
      .setDescription('Insert a \'dedicated-server-stats\' URL')))
  .addSubcommand(x=>x
    .setName('maintenance')
    .setDescription('Lock/unlock "#mp-active-players" channel when server is unavailable to the public')
    .addStringOption(x=>x
      .setName('message')
      .setDescription('The reason why is the server unavailable for?')
      .setRequired(true)))
}
