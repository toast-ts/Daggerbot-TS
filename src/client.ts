import Discord, { Client, WebhookClient, GatewayIntentBits, Partials } from 'discord.js';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import timeNames from './timeNames';
import mongoose from 'mongoose';
import { formatTimeOpt, Tokens, Config, repeatedMessages } from './typings/interfaces';
import bannedWords from './models/bannedWords';
import userLevels from './models/userLevels';
import suggestion from './models/suggestion';
import punishments from './models/punishments';
import bonkCount from './models/bonkCount';
import MPServer from './models/MPServer';
import axios from 'axios';
import moment from 'moment';
import tokens from './tokens.json';

let importconfig:Config
try{
  importconfig = require('./DB-Beta.config.json')
  console.log('Using development config :: Daggerbot Beta')
  //importconfig = require('./Toast-Testbot.config.json')
  //console.log('Using development config :: Toast-Testbot')
} catch(e){
  importconfig = require('./config.json')
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
  xjs: any;
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
        GatewayIntentBits.GuildPresences, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages
      ],
      partials: [
        Partials.Channel,
        Partials.Reaction,
        Partials.Message
      ],
      allowedMentions: {users:[],roles:[]}
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
    this.xjs = require('xml-js');
    this.axios = axios;
    this.ms = require('ms');
    this.userLevels = new userLevels(this);
    this.bonkCount = new bonkCount(this);
    this.punishments = new punishments(this);
    this.bannedWords = new bannedWords(this);
    this.MPServer = new MPServer(this);
    this.suggestion = new suggestion(this);
    this.repeatedMessages = {};
    this.setMaxListeners(80);
    this.statsGraph = -60;
  }
  async init(){
    console.time('Startup');
    mongoose.set('strictQuery', true);
    await mongoose.connect(this.tokens.mongodb_uri, {
      replicaSet: 'toastyy',
      autoIndex: true,
      keepAlive: true,
      serverSelectionTimeoutMS: 15000,
      waitQueueTimeoutMS: 50000,
      socketTimeoutMS: 30000,
      family: 4
    }).then(()=>console.log(this.logTime(), 'Successfully connected to MongoDB')).catch((err)=>{console.error(this.logTime(), `Failed to connect to MongoDB\n${err.reason}`); exec('pm2 stop Daggerbot')})
    await this.login(this.tokens.main);
    const commandFiles = fs.readdirSync('src/commands').filter(file=>file.endsWith('.ts'));
    for (const file of commandFiles){
      const command = require(`./commands/${file}`);
      this.commands.set(command.default.data.name, command)
      this.registry.push(command.default.data.toJSON())
    }
    fs.readdirSync('src/events').forEach((file)=>{
      const eventFile = require(`./events/${file}`);
      this.on(file.replace('.ts', ''), async(...args)=>eventFile.default.run(this,...args));
    });
  }
  formatTime(integer: number, accuracy = 1, options?: formatTimeOpt){
    let achievedAccuracy = 0;
    let text:any = '';
    for (const timeName of timeNames){
      if (achievedAccuracy < accuracy){
        const fullTimelengths = Math.floor(integer/timeName.length);
        if (fullTimelengths == 0) continue;
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
      await this.axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${YTChannelID}`, {timeout: 5000}).then((xml:any)=>Data = this.xjs.xml2js(xml.data, {compact: true, spaces: 2}))
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
  }
}
// hi tae, ik you went to look for secret hello msgs in here too.