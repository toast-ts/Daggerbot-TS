import Discord from 'discord.js';
import TClient from '../client.js';
import Logger from '../helpers/Logger.js';
import CanvasBuilder from '../components/CanvasBuilder.js';
import RanIntoHumor from '../helpers/RanIntoHumor.js';
import MessageTool from '../helpers/MessageTool.js';
import PalletLibrary from '../helpers/PalletLibrary.js';
import {FSData} from 'src/interfaces';
import {requestServerData, mpModuleDisabled, refreshTimerSecs, playtimeStat} from '../modules/MPModule.js';

async function fetchData(client:TClient, interaction:Discord.ChatInputCommandInteraction, serverName:string):Promise<FSData|Discord.InteractionResponse> {
  try {
    const db = await client.MPServer.findInCache();
    const data = await requestServerData(client, db.find(x=>x.serverName === serverName));
    return data.dss as FSData;
  } catch {
    Logger.console('error', 'MPDB', 'Function failed - fetchData');
    return interaction.reply('Ran into a '+RanIntoHumor()+' while trying to retrieve server data, please try again later.');
  }
}

const logPrefix = 'MPDB';
const channels = {
  activePlayers: '739084625862852715',
  announcements: '1084864116776251463',
  mainMpChat: '468835769092669461',
  serverInfo: '543494084363288637',
}
export default class MP {
  static async autocomplete(client: TClient, interaction: Discord.AutocompleteInteraction<'cached'>) {
    const serversInCache = await client.MPServer?.findInCache();
    const filterByActive = serversInCache?.filter(x=>x.isActive)?.map(x=>x.serverName);
    await interaction?.respond(filterByActive?.map(server=>({name: server, value: server})));
  }
  static async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>) {
    if (client.config.botSwitches.mpSys === false) return interaction.reply({embeds: [mpModuleDisabled(client)]});
    if (client.uptime < refreshTimerSecs) return interaction.reply('MPModule isn\'t initialized yet, please wait a moment and try again.');
    if ([channels.mainMpChat, client.config.dcServer.channels.multifarm_chat].includes(interaction.channelId) && !MessageTool.isStaff(interaction.member) && ['status', 'players'].includes(interaction.options.getSubcommand())) return interaction.reply(`Please use <#${channels.activePlayers}> for \`/mp status/players\` commands to prevent clutter in this channel.`).then(()=>setTimeout(()=>interaction.deleteReply(), 6000));
    const choiceSelector = interaction.options.getString('server');
    ({
      players: async()=>{
        const DSS = await fetchData(client, interaction, choiceSelector) as FSData;
        if (!DSS) return console.log('Endpoint failed - players');

        const PDArr = await client.MPServer.fetchPlayerData(choiceSelector);
        const canvas = await CanvasBuilder.generateGraph(PDArr.slice(-120), 'players');
        const players:string[] = [];
        let embedColor:Discord.ColorResolvable;

        try {
          switch (true){
            case DSS?.slots?.used === DSS?.slots?.capacity:
              embedColor = client.config.embedColorRed;
              break;
            case DSS?.slots?.used > 8:
              embedColor = client.config.embedColorYellow;
              break;
            default:
              embedColor = client.config.embedColorGreen;
          }
          for (const player of DSS.slots.players.filter(x=>x.isUsed)) players.push(playtimeStat(player))
          let attachmentName:string = 'MPModule.jpg';

          await interaction.reply({embeds:[new client.embed()
            .setTitle(DSS.server?.name.length > 0 ? DSS.server.name : 'Offline')
            .setColor(embedColor)
            .setDescription(DSS?.slots?.used < 1 ? '*Nobody is playing*' : players.join('\n\n'))
            .setImage(`attachment://${attachmentName}`)
            .setAuthor({name: `${DSS.slots?.used}/${DSS.slots?.capacity}`})
            .setFooter({text: `Current time: ${('0'+Math.floor((DSS?.server.dayTime/3600/1000))).slice(-2)}:${('0'+Math.floor((DSS?.server.dayTime/60/1000)%60)).slice(-2)}`})
          ], files: [new client.attachment(canvas.toBuffer('image/jpeg'), {name: attachmentName})]});
        } catch {}
      },
      details: async()=>{
        const DSS = await fetchData(client, interaction, choiceSelector) as FSData;
        if (!DSS) return console.log('Endpoint failed - details');
        const db = await client.MPServer.findInCache();
        const server = db.find(x=>x.serverName === choiceSelector);

        const dEmbed = new client.embed().setColor(client.config.embedColor).setAuthor({name: 'Crossplay server'}).setDescription(MessageTool.concatMessage(
          `**Name:** \`${DSS.server?.name.length > 0 ? DSS.server.name : '\u200b'}\``,
          '**Password:** `mf4700`',
          `**Map:** \`${DSS.server?.mapName.length > 0 ? DSS.server.mapName : 'No map'}\``,
          `**Mods:** [Click here](http://${server.ip}/mods.html) **|** [Direct link](http://${server.ip}/all_mods_download?onlyActive=true)`,
          '**Filters:** [Click here](https://discord.com/channels/468835415093411861/468835769092669461/926581585938120724)',
          `Please see <#${channels.serverInfo}> for more additional information and rules.`
        ));
        if (DSS.server?.name.length < 1) dEmbed.setFooter({text: 'Server is currently offline'});
        DSS.server ? await interaction.reply({embeds: [dEmbed]}) : null;
      },
      status: async()=>{
        const DSS = await fetchData(client, interaction, choiceSelector) as FSData;
        if (!DSS) return console.log('Endpoint failed - status');

        DSS.server ? await interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).addFields(
          {name: 'Name', value: DSS.server?.name?.length < 1 ? '*`Offline`*' : `\`${DSS?.server?.name}\``},
          {name: 'Players', value: `${DSS?.slots.used}/${DSS?.slots.capacity}`},
          {name: 'Map', value: DSS?.server.mapName}
        ).setFooter({text: `Version: ${DSS?.server?.version} | Time: ${`${('0'+Math.floor((DSS?.server.dayTime/3600/1000))).slice(-2)}:${('0'+Math.floor((DSS?.server.dayTime/60/1000)%60)).slice(-2)}`}`})]}) : null
      },
      pallets: async()=>{
        const DSS = await fetchData(client, interaction, choiceSelector) as FSData;
        if (!DSS) return console.log('Endpoint failed - pallets');
        const filter = DSS?.vehicles.filter(x=>x.category === 'PALLETS');
        if (filter.length < 1) return interaction.reply('No pallets found on the server.');
        else {
          const getLongestName = Object.entries(PalletLibrary(DSS)).map(([name, _])=>name.length).sort((a,b)=>b-a)[0];
          await interaction.reply(MessageTool.concatMessage(
            `There are currently **${filter.length}** pallets on the server. Here\'s the breakdown:\`\`\``,
            Object.entries(PalletLibrary(DSS)).map(([name, count])=>`${name.padEnd(getLongestName+3)}${count}`).join('\n'),
            '```'
          ))
        }
      },
      maintenance: async()=>{
        if (client.config.dcServer.id === interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.dcServer.roles.mpmod) && !interaction.member.roles.cache.has(client.config.dcServer.roles.bottech)) return MessageTool.youNeedRole(interaction, 'mpmod');
        }

        const reason = interaction.options.getString('reason');
        const channel = interaction.guild.channels.cache.get(channels.activePlayers) as Discord.TextChannel;
        const embed = new client.embed().setColor(client.config.embedColor).setAuthor({name: interaction.member.displayName, iconURL: interaction.member.displayAvatarURL({size:1024})}).setTimestamp();
        const isLocked = channel.permissionsFor(interaction.guildId).has('SendMessages');
        const titleAction = isLocked ? '🔒 Locked' : '🔓 Unlocked';

        channel.permissionOverwrites.edit(interaction.guildId, {SendMessages: !isLocked}, {type: 0, reason: `${isLocked ? 'Locked' : 'Unlocked'} by ${interaction.member.displayName}`});
        channel.send({embeds: [embed.setTitle(titleAction).setDescription(`**Reason:**\n${reason}`)]});
        interaction.reply({content: `${MessageTool.formatMention(channels.activePlayers, 'channel')} ${isLocked ? 'locked' : 'unlocked'} successfully`, ephemeral: true});
      },
      start: async()=>{
        if (client.config.dcServer.id === interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.dcServer.roles.mpmod) && !interaction.member.roles.cache.has(client.config.dcServer.roles.bottech)) return MessageTool.youNeedRole(interaction, 'mpmod');
        }
        const map_names = interaction.options.getString('map_names', true).split('|');
        if (map_names.length > 10) return interaction.reply('You can only have up to 10 maps in a poll!');

        const msg = await (interaction.guild.channels.cache.get(channels.announcements) as Discord.TextChannel).send({content: MessageTool.formatMention(client.config.dcServer.roles.mpplayer, 'role'), embeds: [
        new client.embed()
          .setColor(client.config.embedColor)
          .setTitle('Vote for next map!')
          .setDescription(map_names.map((map,i)=>`${i+1}. **${map}**`).join('\n'))
          .setFooter({text: `Poll started by ${interaction.user.tag}`, iconURL: interaction.member.displayAvatarURL({extension: 'webp', size: 1024})})
        ], allowedMentions: {parse: ['roles']}});
        await interaction.reply(`Successfully created a poll in <#${channels.announcements}>`)
        this.reactionSystem(msg, map_names.length);
      },
      end: async()=>{
        if (client.config.dcServer.id === interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.dcServer.roles.mpmod) && !interaction.member.roles.cache.has(client.config.dcServer.roles.bottech)) return MessageTool.youNeedRole(interaction, 'mpmod');
        }
        const msg = await (interaction.guild.channels.cache.get(channels.announcements) as Discord.TextChannel).messages.fetch(interaction.options.getString('message_id', true));
        if (!msg) return interaction.reply('Message not found, please make sure you have the correct message ID.');

        if (msg.embeds[0].title !== 'Vote for next map!') return interaction.reply('This message is not a poll!');
        if (msg.embeds[0].footer?.text?.startsWith('Poll ended by')) return interaction.reply('This poll has already ended!');

        const pollResults = Buffer.from(JSON.stringify({
          map_names: msg.embeds[0].description.split('\n').map(x=>x.slice(3)),
          votes: msg.reactions.cache.map(x=>x.count)
        }, null, 2));
        (client.channels.cache.get(client.config.dcServer.channels.mpmod_chat) as Discord.TextChannel).send({files: [new client.attachment(pollResults, {name: `pollResults-${msg.id}.json`})]});

        msg.edit({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Voting has ended!').setDescription('The next map will be '+msg.embeds[0].description.split('\n')[msg.reactions.cache.map(x=>x.count).indexOf(Math.max(...msg.reactions.cache.map(x=>x.count)))].slice(3)).setFooter({text: `Poll ended by ${interaction.user.tag}`, iconURL: interaction.member.displayAvatarURL({extension: 'webp', size: 1024})})]}).then(()=>msg.reactions.removeAll());
        await interaction.reply(`Successfully ended the [poll](<https://discord.com/channels/${interaction.guildId}/${channels.announcements}/${msg.id}>) in <#${channels.announcements}>`)
      },
      maps: async()=>{
        if (client.config.dcServer.id === interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.dcServer.roles.mpmod) && !interaction.member.roles.cache.has(client.config.dcServer.roles.bottech)) return MessageTool.youNeedRole(interaction, 'mpmod');
        }
        const suggestionPool = await (interaction.guild.channels.cache.get(client.config.dcServer.channels.mpmod_chat) as Discord.TextChannel).messages.fetch('1141293129673232435');
        interaction.reply({embeds: [suggestionPool.embeds[0]]});
      }, // Server management group
      create_server: async()=>{
        if (client.config.dcServer.id === interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.dcServer.roles.mpmanager) && !interaction.member.roles.cache.has(client.config.dcServer.roles.bottech)) return MessageTool.youNeedRole(interaction, 'mpmanager');
        }
        const dedicatedServerStatsURL = interaction.options.getString('dss-url');
        if (!dedicatedServerStatsURL) {
          const fetchUrls = await client.MPServer.findInCache();
          const urlByName = fetchUrls.find(x=>x.serverName === choiceSelector);
          if (urlByName) return await interaction.reply(`http://${urlByName.ip}/feed/dedicated-server-stats.json?code=${urlByName.code}`);
        } else {
          if (!dedicatedServerStatsURL.match(/http.*dedicated-server-stats/)) return interaction.reply(`Improper URL provided, you sent: \`${dedicatedServerStatsURL}\`\nFormat: \`http://<ip>:<port>/feed/dedicated-server-stats.xml?code=<MD5-Code>\`\nI can accept either XML or JSON variants, no need to panic.`);
          const stripURL = dedicatedServerStatsURL.replace(/http:\/\//, '').replace(/\.xml|\.json/g, '.json').split('/feed/dedicated-server-stats.json?code=')
          const stripped = {
            ip: stripURL[0],
            code: stripURL[1]
          };

          Logger.console('log', logPrefix, `Updating the IP for "${choiceSelector}" to ${stripped.ip}`)
          await client.MPServer.addServer(choiceSelector, stripped.ip, stripped.code);
          await interaction.reply(`**${choiceSelector}**'s entry has been successfully created!`);
        }
      },
      remove_server: async()=>{
        if (client.config.dcServer.id === interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.dcServer.roles.mpmanager) && !interaction.member.roles.cache.has(client.config.dcServer.roles.bottech)) return MessageTool.youNeedRole(interaction, 'mpmanager');
        }
        try {
          Logger.console('log', logPrefix, `Removing "${choiceSelector}" from database`)
          await client.MPServer.removeServer(choiceSelector);
          await interaction.reply(`**${choiceSelector}**'s entry has been successfully removed!`);
        } catch {
          Logger.console('log', logPrefix, `Failed to remove "${choiceSelector}", it probably does not exist or something went very wrong`)
          await interaction.reply(`**${choiceSelector}**'s entry does not exist!`);
        }
      },
      visibility_toggle: async()=>{
        if (client.config.dcServer.id === interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.dcServer.roles.mpmanager) && !interaction.member.roles.cache.has(client.config.dcServer.roles.bottech)) return MessageTool.youNeedRole(interaction, 'mpmanager');
        }
        const toggleFlag = interaction.options.getBoolean('is_active');
        Logger.console('log', logPrefix, `Toggling isActive flag for "${choiceSelector}" to ${toggleFlag}`);
        await client.MPServer.toggleServerUsability(choiceSelector, toggleFlag).then(async()=>await interaction.reply(`**${choiceSelector}** is now ${toggleFlag ? 'visible to' : 'hidden from'} public`));
      }
    })[interaction.options.getSubcommand() ?? interaction.options.getSubcommandGroup()]();
  }
  private static async reactionSystem(message:Discord.Message, length:number) {
    const numbersArr = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
    await Promise.all(numbersArr.slice(0, length).map(emote=>message.react(emote)));
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('mp')
    .setDescription('Get information from the FSMP server(s)')
    .addSubcommand(x=>x
      .setName('players')
      .setDescription('Fetches the player list from the requested server')
      .addStringOption(x=>x
        .setName('server')
        .setDescription('The server to fetch the player list from')
        .setAutocomplete(true)
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('details')
      .setDescription('Fetches the information about the requested server')
      .addStringOption(x=>x
        .setName('server')
        .setDescription('The server to fetch the information from')
        .setAutocomplete(true)
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('status')
      .setDescription('Display the status of the requested server')
      .addStringOption(x=>x
        .setName('server')
        .setDescription('The server to fetch the status from')
        .setAutocomplete(true)
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('pallets')
      .setDescription('Fetches how many pallets are on the requested server')
      .addStringOption(x=>x
        .setName('server')
        .setDescription('The server to fetch the pallet count from')
        .setAutocomplete(true)
        .setRequired(true)))
    .addSubcommandGroup(x=>x
      .setName('server_mgmnt')
      .setDescription('Manage the server entries in database, e.g toggling server visiblity, adding/removing, etc.')
      .addSubcommand(x=>x
        .setName('create_server')
        .setDescription('View or update the URL for the requested server')
        .addStringOption(x=>x
          .setName('server')
          .setDescription('The server to create or update')
          .setAutocomplete(true)
          .setRequired(true))
        .addStringOption(x=>x
          .setName('dss-url')
          .setDescription('The URL to the dedicated-server-stats')
          .setRequired(false)))
      .addSubcommand(x=>x
        .setName('remove_server')
        .setDescription('Remove the requested server from database')
        .addStringOption(x=>x
          .setName('server')
          .setDescription('The server to be removed')
          .setAutocomplete(true)
          .setRequired(true)))
      .addSubcommand(x=>x
        .setName('visibility_toggle')
        .setDescription('Toggle isActive flag for the requested server')
        .addStringOption(x=>x
          .setName('server')
          .setDescription('The server to toggle the flag')
          .setAutocomplete(true)
          .setRequired(true))
        .addBooleanOption(x=>x
          .setName('is_active')
          .setDescription('Whether to hide or show the server from the public view')
          .setRequired(true))))
    .addSubcommand(x=>x
      .setName('maintenance')
      .setDescription('Toggle the maintenance mode for #mp-active-players channel')
      .addStringOption(x=>x
        .setName('reason')
        .setDescription('The message to send to the channel after toggling')
        .setRequired(true)))
    .addSubcommandGroup(x=>x
      .setName('poll')
      .setDescription('Create or end a map poll in #mp-announcements channel')
      .addSubcommand(x=>x
        .setName('start')
        .setDescription('Start a map poll')
        .addStringOption(x=>x
          .setName('map_names')
          .setDescription('Map names separated by |\'s, up to 10 maps!')
          .setRequired(true)))
      .addSubcommand(x=>x
        .setName('end')
        .setDescription('End a map poll')
        .addStringOption(x=>x
          .setName('message_id')
          .setDescription('Message ID of the poll')
          .setRequired(true)))
      .addSubcommand(x=>x
        .setName('maps')
        .setDescription('Fetch the list of maps currently in the suggestion pool')))
}
