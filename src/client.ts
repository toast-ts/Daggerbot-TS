import Discord, {Client, GatewayIntentBits, Partials} from 'discord.js';
import {readFileSync, readdirSync} from 'node:fs';
import {formatTimeOpt, Tokens, Config, repeatedMessages, type MPServerCache} from './typings/interfaces';
import bannedWords from './models/bannedWords.js';
import userLevels from './models/userLevels.js';
import suggestion from './models/suggestion.js';
import punishments from './models/punishments.js';
import tags from './models/tagSystem.js';
import bonkCount from './models/bonkCount.js';
import MPServer from './models/MPServer.js';
import DatabaseServer from './DatabaseServer.js';
import xjs from 'xml-js';
import moment from 'moment';
const tokens = JSON.parse(readFileSync('src/tokens.json', 'utf8'));
// Import assertion warning workaround yes

let importconfig:Config
try{
  importconfig = JSON.parse(readFileSync('src/DB-Beta.config.json', 'utf8'));
  console.log('Using development config :: Daggerbot Beta')
} catch(e){
  importconfig = JSON.parse(readFileSync('src/config.json', 'utf8'))
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
  ms: any;
  userLevels: userLevels;
  punishments: punishments;
  bonkCount: bonkCount;
  bannedWords: bannedWords;
  MPServer: MPServer;
  MPServerCache: MPServerCache = {};
  suggestion: suggestion;
  tags: tags;
  repeatedMessages: repeatedMessages;
  statsGraph: number;

  constructor(){
    super({
      intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.DirectMessages
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
    this.ms = import('ms').then(i=>i);
    this.userLevels = new userLevels(this);
    this.bonkCount = new bonkCount(this);
    this.punishments = new punishments(this);
    this.bannedWords = new bannedWords(this);
    this.MPServer = new MPServer(this);
    this.MPServerCache = {} as MPServerCache;
    this.suggestion = new suggestion(this);
    this.tags = new tags(this);
    this.repeatedMessages = {};
    this.setMaxListeners(45);
    this.statsGraph = -120;
  }
  async init(){
    console.time('Startup');
    await DatabaseServer(this);
    this.login(this.tokens.main);
    for (const file of readdirSync('dist/events')){
      const eventFile = await import(`./events/${file}`);
      this.on(file.replace('.js',''), async(...args)=>eventFile.default.run(this,...args))
    }
    for (const file of readdirSync('dist/commands')){
      const command = await import(`./commands/${file}`);
      this.commands.set(command.default.data.name,{command, uses: 0});
      this.registry.push(command.default.data.toJSON())
    }
    for (const naming of Object.keys(this.config.MPStatsLocation)){
      this.MPServerCache[naming] = {
        players: [],
        status: null,
        name: null
      }
    }
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
  formatPlayerUptime(oldTime:number){
    var Hours=0;
    oldTime=Math.floor(Number(oldTime));
    if(oldTime>=60){
      var Hours=Math.floor(Number(oldTime)/60);
      var Minutes=(Number(oldTime)-(Hours*60));
    } else Minutes=Number(oldTime)
    if(Hours>=24){
      var Days=Math.floor(Number(Hours)/24);
      var Hours=(Hours-(Days*24));
    } return (Days>0?Days+' d ':'')+(Hours>0?Hours+' h ':'')+(Minutes>0?Minutes+' m':'')
  }
  isStaff = (guildMember:Discord.GuildMember)=>this.config.mainServer.staffRoles.map((x: string)=>this.config.mainServer.roles[x]).some((x: string)=>guildMember.roles.cache.has(x));

  youNeedRole = (interaction:Discord.CommandInteraction, role:string)=>interaction.reply(`This command is restricted to <@&${this.config.mainServer.roles[role]}>`);

  logTime = ()=>`[${this.moment().format('DD/MM/YY HH:mm:ss')}]`;

  async punish(interaction: Discord.ChatInputCommandInteraction<'cached'>, type: string){
    if (!this.isStaff(interaction.member as Discord.GuildMember)) return this.youNeedRole(interaction, "dcmod");
    
    const time = interaction.options.getString('time') ?? undefined;
    const reason = interaction.options.getString('reason') ?? 'Reason unspecified';
    const GuildMember = interaction.options.getMember('member') ?? undefined;
    const User = interaction.options.getUser('member', true);

    console.log(this.logTime(), `[PunishmentLog] ${GuildMember?.user?.username ?? User?.username ?? 'No user data'} ${time ? ['warn', 'kick'].includes(this.punishments.type) ? 'and no duration set' : `and ${time} (duration)` : ''} was used in /${interaction.commandName} for ${reason}`);
    (this.channels.cache.get(this.config.mainServer.channels.punishment_log) as Discord.TextChannel).send({embeds:[new this.embed().setColor(this.config.embedColor).setAuthor({name: interaction?.user?.username, iconURL: interaction?.user?.displayAvatarURL({size:2048})}).setTitle('Punishment Log').setDescription(`${GuildMember?.user?.username ?? User?.username ?? 'No user data'} ${time ? ['warn', 'kick'].includes(this.punishments.type) ? 'and no duration set' : `and ${time} (duration)` : ''} was used in \`/${interaction.commandName}\` for \`${reason}\``).setTimestamp()]});
    if (interaction.user.id === User.id) return interaction.reply(`You cannot ${type} yourself.`);
    if (!GuildMember && type != 'unban') return interaction.reply(`You cannot ${type} someone who is not in the server.`);
    if (User.bot) return interaction.reply(`You cannot ${type} a bot!`);

    await interaction.deferReply();
    await this.punishments.addPunishment(type, { time, interaction }, interaction.user.id, reason, User, GuildMember);
  }
  async YTLoop(YTChannelID: string, YTChannelName: string, DCChannelID: string){
    let Data:any;

    try {
      await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YTChannelID}`, {signal: AbortSignal.timeout(6000),headers:{'User-Agent':`Daggerbot - Notification/fetch`}}).then(async xml=>Data = this.xjs.xml2js(await xml.text(), {compact: true}))
    } catch(err){
      console.log(this.logTime(), `${YTChannelName} YT fail`)
    }

    if (!Data) return;
    if (!this.YTCache[YTChannelID]) return this.YTCache[YTChannelID] = Data.feed.entry[0]['yt:videoId']._text;
    if (Data.feed.entry[1]['yt:videoId']._text === this.YTCache[YTChannelID]){
      this.YTCache[YTChannelID] = Data.feed.entry[0]['yt:videoId']._text;
      (this.channels.resolve(DCChannelID) as Discord.TextChannel).send(`**${YTChannelName}** just uploaded a video!\n${Data.feed.entry[0].link._attributes.href}`)
    }
  }
  formatBytes(bytes:number, decimals:number = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals < 0 ? 0 : decimals)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
  }
  removeUsername = (text: string)=>{
    let matchesLeft = true;
    const dirSlash = process.platform === 'linux' ? '\/' : '\\';
    const array = text.split(dirSlash);
    while (matchesLeft){
      let usersIndex = array.indexOf(process.platform === 'linux' ? 'home' : 'Users');
      if (usersIndex<1) matchesLeft = false;
      else {
        let usernameIndex = usersIndex+1;
        if(array[usernameIndex].length == 0) usernameIndex += 1;
        array[usernameIndex] = '･'.repeat(array[usernameIndex].length);
        array[usersIndex] = process.platform === 'linux' ? 'ho\u200bme' : 'Us\u200bers';
      }
    } return array.join(dirSlash);
  }
}
