import Discord, { Client, WebhookClient, GatewayIntentBits, Partials } from 'discord.js';
import fs from 'node:fs';
import {exec} from 'node:child_process';
import mongoose from 'mongoose';
import {formatTimeOpt, Tokens, Config, repeatedMessages} from './typings/interfaces';
import bannedWords from './models/bannedWords.js';
import userLevels from './models/userLevels.js';
import suggestion from './models/suggestion.js';
import punishments from './models/punishments.js';
import bonkCount from './models/bonkCount.js';
import MPServer from './models/MPServer.js';
import xjs from 'xml-js';
import axios from 'axios';
import moment from 'moment';
import tokens from './tokens.json' assert { type: 'json'};

let importconfig:Config
try{
  importconfig = JSON.parse(fs.readFileSync('src/DB-Beta.config.json', {encoding:'utf8'}));
  console.log('Using development config :: Daggerbot Beta')
} catch(e){
  importconfig = JSON.parse(fs.readFileSync('src/config.json', {encoding:'utf8'}))
  console.log('Using production config')
}

export default class TClient extends Client {
  invites: Map<any, any>;
  commands: Discord.Collection<string, any>;
  registry: Array<Discord.ApplicationCommandDataResolvable>;
  config: Config;
  tokens: Tokens;
  YTCache: any;
  embed: typeof Discord.EmbedBuilder;
  collection: any;
  messageCollector: any;
  attachmentBuilder: any;
  moment: typeof moment;
  xjs: typeof xjs;
  axios: typeof axios;
  ms: any;
  userLevels: userLevels;
  punishments: punishments;
  bonkCount: bonkCount;
  bannedWords: bannedWords;
  MPServer: MPServer;
  suggestion: suggestion;
  repeatedMessages: repeatedMessages;
  statsGraph: number;

  constructor(){
    super({
      intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages
      ], partials: [
        Partials.Channel, Partials.Reaction, Partials.Message
      ], allowedMentions: {users:[],roles:[]}
    })
    this.invites = new Map();
    this.commands = new Discord.Collection();
    this.registry = [];
    this.config = importconfig as Config;
    this.tokens = tokens as Tokens;
    this.YTCache = {
      'UCQ8k8yTDLITldfWYKDs3xFg': undefined, // Daggerwin
      'UCguI73--UraJpso4NizXNzA': undefined // Machinery Restorer
    }
    this.embed = Discord.EmbedBuilder;
    this.collection = Discord.Collection;
    this.messageCollector = Discord.MessageCollector;
    this.attachmentBuilder = Discord.AttachmentBuilder;
    this.moment = moment;
    this.xjs = xjs;
    this.axios = axios;
    this.ms = import('ms').then(i=>i);
    this.userLevels = new userLevels(this);
    this.bonkCount = new bonkCount(this);
    this.punishments = new punishments(this);
    this.bannedWords = new bannedWords(this);
    this.MPServer = new MPServer(this);
    this.suggestion = new suggestion(this);
    this.repeatedMessages = {};
    this.setMaxListeners(20);
    this.statsGraph = -60;
  }
  async init(){
    console.time('Startup');
    mongoose.set('strictQuery', true);
    await mongoose.connect(this.tokens.mongodb_uri, {
      replicaSet: 'toastyy',
      autoIndex: true,
      serverSelectionTimeoutMS: 15000,
      waitQueueTimeoutMS: 50000,
      socketTimeoutMS: 30000,
      family: 4
    }).then(()=>console.log(this.logTime(), 'Successfully connected to MongoDB')).catch(err=>{console.error(this.logTime(), `Failed to connect to MongoDB\n${err.reason}`); exec('pm2 stop Daggerbot')})
    this.login(this.tokens.main);
    for await (const file of fs.readdirSync('dist/events')){
      const eventFile = await import(`./events/${file}`);
      this.on(file.replace('.js',''), async(...args)=>eventFile.default.run(this,...args))
    };
    for await (const file of fs.readdirSync('dist/commands')){
      const command = await import(`./commands/${file}`);
      this.commands.set(command.default.data.name,{command, uses: 0});
      this.registry.push(command.default.data.toJSON())
    };
  }
  formatTime(integer: number, accuracy = 1, options?: formatTimeOpt){
    let achievedAccuracy = 0;
    let text:any = '';
    for (const timeName of [
      {name: 'year',   length: 31536000000},
      {name: 'month',  length: 2592000000},
      {name: 'week',   length: 604800000},
      {name: 'day',    length: 86400000},
      {name: 'hour',   length: 3600000},
      {name: 'minute', length: 60000},
      {name: 'second', length: 1000}
    ]){
      if (achievedAccuracy < accuracy){
        const fullTimelengths = Math.floor(integer/timeName.length);
        if (fullTimelengths === 0) continue;
        achievedAccuracy++;
        text += fullTimelengths + (options?.longNames ? (' '+timeName.name+(fullTimelengths === 1 ? '' : 's')) : timeName.name.slice(0, timeName.name === 'month' ? 2 : 1)) + (options?.commas ? ', ' : ' ');
        integer -= fullTimelengths*timeName.length;
      } else break;
    }
    if (text.length == 0) text = integer + (options?.longNames ? ' milliseconds' : 'ms') + (options?.commas ? ', ' : '');
    if (options?.commas){
      text = text.slice(0, -2);
      if (options?.longNames){
        text = text.split('');
        text[text.lastIndexOf(',')] = ' and';
        text = text.join('');
      }
    } return text.trim();
  }
  isStaff = (guildMember:Discord.GuildMember)=>this.config.mainServer.staffRoles.map((x: string)=>this.config.mainServer.roles[x]).some((x: string)=>guildMember.roles.cache.has(x));

  youNeedRole = (interaction:Discord.CommandInteraction, role:string)=>interaction.reply(`This command is restricted to <@&${this.config.mainServer.roles[role]}>`);

  logTime = ()=>`[${this.moment().format('DD/MM/YY HH:mm:ss')}]`;

  alignText(text: string, length: number, alignment: string, emptyChar = ' '){
    if (alignment == 'right') text = emptyChar.repeat(length - text.length)+text;
    else if (alignment == 'middle'){
      const emptyCharsPerSide = (length - text.length)/2;
      text = emptyChar.repeat(Math.floor(emptyCharsPerSide))+text+emptyChar.repeat(Math.floor(emptyCharsPerSide));
    } else text = text + emptyChar.repeat(length - text.length);
    return text;
  }
  async punish(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>, type: string){
    if (!client.isStaff(interaction.member as Discord.GuildMember)) return client.youNeedRole(interaction, "dcmod");
    
    const time = interaction.options.getString('time') ?? undefined;
    const reason = interaction.options.getString('reason') ?? 'Reason unspecified';
    const GuildMember = interaction.options.getMember('member') ?? undefined;
    const User = interaction.options.getUser('member', true);
    
    console.log(client.logTime(), `[PunishmentLog] ${GuildMember.user.tag ?? User.tag ?? 'No user data'} and ${time ?? 'no duration set'} was used in /${interaction.commandName} for ${reason}`);
    if (interaction.user.id == User.id) return interaction.reply(`You cannot ${type} yourself.`);
    if (!GuildMember && type != 'ban') return interaction.reply(`You cannot ${type} someone who is not in the server.`);
    if (User.bot) return interaction.reply(`You cannot ${type} a bot!`);

    await interaction.deferReply();
    await client.punishments.addPunishment(type, { time, interaction }, interaction.user.id, reason, User, GuildMember);
  }
  async YTLoop(YTChannelID: string, YTChannelName: string, DCChannelID: string){
    let Data:any;
    let error;

    try {
      await this.axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${YTChannelID}`, {timeout: 5000}).then((xml:any)=>Data = this.xjs.xml2js(xml.data, {compact: true}))
    } catch(err){
      error = true;
      console.log(this.logTime(), `${YTChannelName} YT fail`)
    }

    if (!Data) return;
    if (this.YTCache[YTChannelID] == undefined){
      this.YTCache[YTChannelID] = Data.feed.entry[0]['yt:videoId']._text;
      return;
    }
    if (Data.feed.entry[1]['yt:videoId']._text == this.YTCache[YTChannelID]){
      this.YTCache[YTChannelID] = Data.feed.entry[0]['yt:videoId']._text;
      (this.channels.resolve(DCChannelID) as Discord.TextChannel).send(`**${YTChannelName}** just uploaded a video!\n${Data.feed.entry[0].link._attributes.href}`)
    }
  }
}

export class WClient extends WebhookClient {
  tokens: Tokens;
  constructor(){
    super({
      url: tokens.webhook_url
    })
    this.tokens = tokens as Tokens;
  }
}
// hi tae, ik you went to look for secret hello msgs in here too.