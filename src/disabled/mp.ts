import Discord from 'discord.js';
import TClient from '../client.js';
import path from 'node:path';
import canvas from 'canvas';
import {readFileSync} from 'node:fs';

async function MPdata(client:TClient, interaction:Discord.ChatInputCommandInteraction, embed: Discord.EmbedBuilder, serverSelector: any) {
  //let serverSelector;
  if (!await client.MPServer._content.findOne({_id:interaction.guildId})) return interaction.reply('This server isn\'t linked to the bot.');
  const ServerURL = await client.MPServer._content.findById(interaction.guildId);
  if (!ServerURL) return interaction.reply(`No FS server found, please notify <@&${client.config.mainServer.roles.mpmanager}> to add it.`);
  if (!ServerURL.mainServer.ip.match(/http|https/) ?? !ServerURL.secondServer.ip.match(/http|https/)) return interaction.reply(`The server IP for this server is currently invalid, please notify <@&${client.config.mainServer.roles.mpmanager}>`);
  if (interaction.options.getString('server').includes('mainServer')) {
    try {
      serverSelector = await client.axios.get(ServerURL.mainServer.ip+'/feed/dedicated-server-stats.json?code='+ServerURL.mainServer.code, {
        timeout: 2550,
        headers: {'User-Agent': `Daggerbot - mp cmd/axios ${client.axios.VERSION}`}
      })
    } catch(err) {
      embed.setTitle('Host did not respond back in time').setColor(client.config.embedColorRed);
      console.log(client.logTime(), 'DagMP:Main failed to fetch, host didn\'t respond in time.');
      interaction.reply('Host didn\'t respond back in time.')
      return serverSelector
    }
  } else {
    try {
      serverSelector = await client.axios.get(ServerURL.secondServer.ip+'/feed/dedicated-server-stats.json?code='+ServerURL.secondServer.code, {
        timeout: 2550,
        headers: {'User-Agent': `Daggerbot - mp cmd/axios ${client.axios.VERSION}`}
      })
    } catch(err) {
      embed.setTitle('Host did not respond back in time').setColor(client.config.embedColorRed);
      console.log(client.logTime(), 'DagMP:Second failed to fetch, host didn\'t respond in time.');
      interaction.reply('Host didn\'t respond back in time.')
      return serverSelector
    }
  }
  console.log(serverSelector)
}

export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (interaction.channelId === '468835769092669461' && !client.isStaff(interaction.member) && ['status', 'players'].includes(interaction.options.getSubcommand())) {
      interaction.reply(`Please use <#739084625862852715> for \`/mp status/players\` commands to prevent clutter in this channel.`).then(()=>setTimeout(()=>interaction.deleteReply(), 6000));
      return;
    }
    ({
      status: async()=>{
        const embed0 = new client.embed();
        const FSserver0 = await MPdata(client, interaction, embed0, 'mainServer');
        if (!FSserver0?.data) return console.log('FSserver0 failed - status');
        try {
          if (FSserver0.data.server.name.length > 1){
            interaction.reply({embeds: [embed0.setTitle('Status/Details').setColor(client.config.embedColor).addFields(
              {name: 'Server name', value: `${FSserver0?.data.server.name.length == 0 ? '\u200b' : `\`${FSserver0?.data.server.name}\``}`, inline: true},
              {name: 'Players', value: `${FSserver0.data.slots.used} out of ${FSserver0.data.slots.capacity}`, inline: true},
              {name: 'Current map', value: `${FSserver0?.data.server.mapName.length == 0 ? '\u200b' : FSserver0.data.server.mapName}`, inline: true},
              {name: 'Version', value: `${FSserver0?.data.server.version.length == 0 ? '\u200b' : FSserver0.data.server.version}`, inline: true},
              {name: 'In-game Time', value: `${('0' + Math.floor((FSserver0.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((FSserver0.data.server.dayTime/60/1000)%60)).slice(-2)}`, inline: true}
            )]})
          } else if (FSserver0.data.server.name.length === 0) interaction.reply('Server is currently offline.')
        } catch (err){
          console.log(err)
          interaction.reply('FSserver0 Error placeholder')
        };
      },
      info: async()=>{
        const embed2 = new client.embed().setColor(client.config.embedColor)
        const FSserver2 = await MPdata(client, interaction, embed2, 'secondServer')
        if (!FSserver2?.data) return console.log('FSserver2 failed - info')
        const MPURL = await client.MPServer._content.findById(interaction.guildId);
        if (FSserver2.data.server.name.length == 0) embed2.setFooter({text: 'Server is currently offline.'})
        interaction.reply({embeds: [embed2.setDescription([
          `**Server name**: \`${FSserver2?.data.server.name.length === 0 ? '\u200b' : FSserver2?.data.server.name}\``,
          '**Password:** `mf4700`',
          '**Crossplay server**',
          `**Map:** ${FSserver2.data.server.mapName.length == 0 ? 'Null Island' : FSserver2.data.server.mapName}`,
          `**Mods:** [Click here](${MPURL.mainServer.ip}/mods.html) **|** [Direct Download](${MPURL.mainServer.ip}/all_mods_download?onlyActive=true)`,
          '**Filters:** [Click here](https://discord.com/channels/468835415093411861/468835769092669461/926581585938120724)',
          'Please see <#543494084363288637> for additional information.'
        ].join('\n'))]});
      },
      url: async()=>{
        if (client.config.mainServer.id == interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager) && !interaction.member.roles.cache.has(client.config.mainServer.roles.bottech) && !interaction.member.roles.cache.has(client.config.mainServer.roles.admin)) return client.youNeedRole(interaction, 'mpmanager');
        }
        const address = interaction.options.getString('address');
        if (!address){
          try {
            const Url = await client.MPServer._content.findById(interaction.guildId);
            if (interaction.options.getString('server').includes('mainServer')) {
              if (Url.mainServer.ip && Url.mainServer.code) return interaction.reply(Url.mainServer.ip+'/feed/dedicated-server-stats.json?code='+Url.mainServer.code)
            } else {
              if (Url.secondServer.ip && Url.secondServer.code) return interaction.reply(Url.secondServer.ip+'/feed/dedicated-server-stats.json?code='+Url.secondServer.code)
            }
          } catch(err){
            console.log(`MPDB :: ${err}`);
            interaction.reply(`\`\`\`${err}\`\`\``)
          }
        } else {
          if (!address.match(/dedicated-server-stats/)) return interaction.reply('The URL does not match `dedicated-server-stats.xml`');
          const newURL = address.replace('xml','json').split('/feed/dedicated-server-stats.json?code=');
          try {
            if (interaction.options.getString('server').includes('mainServer')) {
              console.log(`MPDB :: Main Server\'s URL for ${interaction.guild.name} has been modified by ${interaction.member.displayName} (${interaction.member.id})`);
              await client.MPServer._content.create({
                _id: interaction.guildId, mainServer: { ip: newURL[0], code: newURL[1] }, secondServer: { ip: 'unknown', code: 'unknown' }
              })
              .then(()=>interaction.reply('This guild is not found in database, therefore I have created it for you.'))
              .catch((err:Error)=>interaction.reply(`I ran into a brick wall while creating the server data:\n${err.message}`))
            } else {
              console.log(`MPDB :: Second Server\'s URL for ${interaction.guild.name} has been modified by ${interaction.member.displayName} (${interaction.member.id})`)
              await client.MPServer._content.findOneAndUpdate(
                {_id: interaction.guildId},{$set: {secondServer: {ip: newURL[0], code: newURL[1]}}}
              )
              .then(()=>interaction.reply('URL for second server successfully updated.'))
              .catch((err:Error)=>interaction.reply(`I got hit by a flying fish while updating the server data:\n${err.message}`))
            }
          } catch(err) {
            if (interaction.options.getString('server').includes('mainServer')) {
              const affected = await client.MPServer._content.findByIdAndUpdate({_id: interaction.guildId}, {$set: {mainServer:{ip: newURL[0], code: newURL[1]}}})
              if (affected) return interaction.reply('URL for Main Server successfully updated.')
            } else {
              const affected = await client.MPServer._content.findByIdAndUpdate({_id: interaction.guildId}, {$set: {secondServer:{ip: newURL[0], code: newURL[1]}}})
              if (affected) return interaction.reply('URL for Second Server successfully updated.')
            }
          }
        }
      },
      players: async()=>{
        const data = JSON.parse(readFileSync(path.join('src/database/MPPlayerData.json'), {encoding: 'utf8'})).slice(client.statsGraph)
        // handle negative days
        data.forEach((change: number, i: number) => {
          if (change < 0) data[i] = data[i - 1] || data[i + 1] || 0;
        });

        const first_graph_top = 16;
        const second_graph_top = 16;
        const textSize = 40;

        const img = canvas.createCanvas(1500, 750);
        const ctx = img.getContext('2d');

        const graphOrigin = [15, 65];
        const graphSize = [1300, 630];
        const nodeWidth = graphSize[0] / (data.length - 1);
        ctx.fillStyle = '#36393f'; //'#111111';
        ctx.fillRect(0, 0, img.width, img.height);

        // grey horizontal lines
        ctx.lineWidth = 5;

        let interval_candidates = [];
        for (let i = 4; i < 10; i++) {
          const interval = first_graph_top / i;
          if (Number.isInteger(interval)) {
            let intervalString = interval.toString();
            const reference_number = i * Math.max(intervalString.split('').filter(x => x === '0').length / intervalString.length, 0.3) * (['1', '2', '4', '5', '6', '8'].includes(intervalString[0]) ? 1.5 : 0.67)
            interval_candidates.push([interval, i, reference_number]);
          }
        }
        const chosen_interval = interval_candidates.sort((a, b) => b[2] - a[2])[0];

        const previousY: Array<number> = [];

        ctx.strokeStyle = '#202225'; //'#555B63';
        for (let i = 0; i <= chosen_interval[1]; i++) {
          const y = graphOrigin[1] + graphSize[1] - (i * (chosen_interval[0] / second_graph_top) * graphSize[1]);
          if (y < graphOrigin[1]) continue;
          const even = ((i + 1) % 2) === 0;
          if (even) ctx.strokeStyle = '#2c2f33'; //'#3E4245';
          ctx.beginPath();
          ctx.lineTo(graphOrigin[0], y);
          ctx.lineTo(graphOrigin[0] + graphSize[0], y);
          ctx.stroke();
          ctx.closePath();
          if (even) ctx.strokeStyle = '#202225'; //'#555B63';
          previousY.push(y, i * chosen_interval[0]);
        }

        // 30m mark
        ctx.setLineDash([8, 16]);
        ctx.beginPath();
        const lastMonthStart = graphOrigin[0] + (nodeWidth * (data.length - 30));
        ctx.lineTo(lastMonthStart, graphOrigin[1]);
        ctx.lineTo(lastMonthStart, graphOrigin[1] + graphSize[1]);
        ctx.stroke();
        ctx.closePath();
        ctx.setLineDash([]);

        // draw points
        ctx.lineWidth = 5;

        function getYCoordinate(value: number) {
          return ((1 - (value / second_graph_top)) * graphSize[1]) + graphOrigin[1];
        }

        function colorAtPlayercount(playercount: number) {
          if (playercount === first_graph_top) return client.config.embedColorRed as string;
          else if (playercount > 9) return client.config.embedColorYellow as string;
          else return client.config.embedColorGreen as string
        }
        let lastCoords: Array<number> = [];
        data.forEach((curPC: number /* current player count */, i: number) => {
          if (curPC < 0) curPC = 0;
          const x = i * nodeWidth + graphOrigin[0];
          const y = getYCoordinate(curPC);
          const nexPC /* next player count */ = data[i + 1];
          const prvPC /* previous player count */ = data[i - 1];
          const curColor = colorAtPlayercount(curPC); // color now
          const prvColor = colorAtPlayercount(prvPC); // color at last point
          if (curColor !== prvColor && !isNaN(prvPC) && lastCoords.length > 0) { // gradient should be used when the color between now and last point is not the same
            // gradient from now to last point
            const grd = ctx.createLinearGradient(lastCoords[0], lastCoords[1], x, y);
            grd.addColorStop(0, colorAtPlayercount(prvPC)); // prev color at the beginning
            grd.addColorStop(1, colorAtPlayercount(curPC)); // cur color at the end
            // special case: playercount rises or falls rapidly accross all colors (eg. straight from red to green)
            if (curColor !== client.config.embedColorYellow && prvColor !== client.config.embedColorYellow) {
              const yellowY = getYCoordinate(10); // y coordinate at which line should be yellow
              const stop = (yellowY - lastCoords[1]) / (y - lastCoords[1]); // between 0 and 1, where is yellowY between y and nextPointCoords[1] ?
              grd.addColorStop(stop, client.config.embedColorYellow as string); // add a yellow stop to the gradient
            }
            ctx.strokeStyle = grd;
          } else ctx.strokeStyle = colorAtPlayercount(curPC);
          ctx.beginPath();
          if (lastCoords.length > 0) ctx.moveTo(lastCoords[0], lastCoords[1]);
          // if the line being drawn is horizontal, make it go until it has to go down
          if (y === lastCoords[1]) {
            let newX = x;
            for (let j = i + 1; j <= data.length; j++) {
              if (data[j] === curPC) newX += nodeWidth; else break;
            }
            ctx.lineTo(newX, y);
          } else ctx.lineTo(x, y);
          lastCoords = [x, y];
          ctx.stroke();
          ctx.closePath();

          if (curPC === prvPC && curPC === nexPC) return; // no ball because no vertical difference to next or prev point
          else {
            // ball
            ctx.fillStyle = colorAtPlayercount(curPC);
            ctx.beginPath();
            ctx.arc(x, y, ctx.lineWidth * 1.3, 0, 2 * Math.PI)
            ctx.closePath();
            ctx.fill();
          }
        });

        // draw text
        ctx.font = '400 ' + textSize + 'px sans-serif';
        ctx.fillStyle = 'white';

        // highest value
        const maxx = graphOrigin[0] + graphSize[0] + textSize / 2;
        const maxy = previousY[0] + (textSize / 3);
        ctx.fillText(previousY[1].toLocaleString('en-US'), maxx, maxy);

        // lowest value
        const lowx = graphOrigin[0] + graphSize[0] + textSize / 2;
        const lowy = graphOrigin[1] + graphSize[1] + (textSize / 3);
        ctx.fillText('0 players', lowx, lowy);

        // 30m
        ctx.fillText('30 mins ago', lastMonthStart, graphOrigin[1] - (textSize / 2));

        // time ->
        const tx = graphOrigin[0] + (textSize / 2);
        const ty = graphOrigin[1] + graphSize[1] + (textSize);
        ctx.fillText('time ->', tx, ty);

        const embed1 = new client.embed();
        const FSserver1 = await MPdata(client, interaction, embed1, 'mainServer')
        if (!FSserver1?.data) return console.log('FSserver1 failed - players')
        embed1.setTitle(FSserver1?.data.server.name.length === 0 ? 'Offline' : FSserver1?.data.server.name)
          .setDescription(`${FSserver1?.data.slots.used}/${FSserver1?.data.slots.capacity}`)
          .setColor(FSserver1?.data.server.name.length === 0 ? client.config.embedColorRed : client.config.embedColor)
          .setImage('attachment://FSStats.png');
        FSserver1?.data.slots.players.filter(x=>x.isUsed).forEach(player=>embed1.addFields({name: `${player.name} ${player.isAdmin ? '| admin' : ''}`, value: `Farming for ${client.formatPlayerUptime(player.uptime)}`}))
        interaction.reply({embeds: [embed1], files: [new client.attachmentBuilder(img.toBuffer(),{name:'FSStats.png'})]})
      },
      maintenance: ()=>{
        if (client.config.mainServer.id == interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager) && !interaction.member.roles.cache.has(client.config.mainServer.roles.bottech) && !interaction.member.roles.cache.has(client.config.mainServer.roles.admin)) return client.youNeedRole(interaction, 'mpmanager');
        }
        const maintenanceMessage = interaction.options.getString('message');
        const activePlayersChannel = '739084625862852715';
        const channel = (client.channels.cache.get(activePlayersChannel) as Discord.TextChannel);
        if (channel.permissionOverwrites.cache.get(interaction.guildId).deny.has('SendMessages')) {
          channel.permissionOverwrites.edit(interaction.guildId, {SendMessages: true}, {type: 0, reason: `Unlocked by ${interaction.member.displayName}`});
          channel.send({embeds: [new client.embed().setColor(client.config.embedColor).setAuthor({name: interaction.member.displayName, iconURL: interaction.member.displayAvatarURL({size:1024})}).setTitle('🔓 Channel unlocked').setDescription(`**Reason:**\n${maintenanceMessage}`).setTimestamp()]});
          interaction.reply({content: `<#${activePlayersChannel}> has been unlocked!`, ephemeral: true});
        } else if (channel.permissionOverwrites.cache.get(interaction.guildId).allow.has('SendMessages')) {
          channel.permissionOverwrites.edit(interaction.guildId, {SendMessages: false}, {type: 0, reason: `Locked by ${interaction.member.displayName}`});
          channel.send({embeds: [new client.embed().setColor(client.config.embedColor).setAuthor({name: interaction.member.displayName, iconURL: interaction.member.displayAvatarURL({size:1024})}).setTitle('🔒 Channel locked').setDescription(`**Reason:**\n${maintenanceMessage}`).setTimestamp()]});
          interaction.reply({content: `<#${activePlayersChannel}> has been locked!`, ephemeral: true});
        }
      }
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
