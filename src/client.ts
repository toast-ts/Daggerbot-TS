interface repeatedMessages {
  [key: string]: {data: Discord.Collection<number,{type:string,channel:string}>,timeout: NodeJS.Timeout}
}
type MPServerCache = Record<string,{
  players: FSPlayer[],
  status: 'online' | 'offline' | null,
  name: string | null
}>

import Discord from 'discord.js';
import {readFileSync, readdirSync} from 'node:fs';
import {Config, FSPlayer} from './typings/interfaces';
import bannedWords from './models/bannedWords.js';
import userLevels from './models/userLevels.js';
import suggestion from './models/suggestion.js';
import punishments from './models/punishments.js';
import tags from './models/tagSystem.js';
import bonkCount from './models/bonkCount.js';
import MPServer from './models/MPServer.js';
import DatabaseServer from './funcs/DatabaseServer.js';
import CacheServer from './funcs/CacheServer.js';
import xjs from 'xml-js';
import moment from 'moment';
import TSClient from './helpers/TSClient.js';

let importconfig:Config
try{
  importconfig = JSON.parse(readFileSync('src/DB-Beta.config.json', 'utf8'));
  console.log('Using development config :: Daggerbot Beta')
} catch(e){
  importconfig = JSON.parse(readFileSync('src/config.json', 'utf8'))
  console.log('Using production config')
}

export default class TClient extends Discord.Client {
  invites: Map<any, any>;
  commands: Discord.Collection<string, any>;
  registry: Array<Discord.ApplicationCommandDataResolvable>;
  config: Config;
  embed: typeof Discord.EmbedBuilder;
  collection: typeof Discord.Collection;
  attachmentBuilder: typeof Discord.AttachmentBuilder;
  moment: typeof moment;
  xjs: typeof xjs;
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
        Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildModeration, Discord.GatewayIntentBits.GuildInvites,
        Discord.GatewayIntentBits.GuildMessageReactions, Discord.GatewayIntentBits.GuildPresences,
        Discord.GatewayIntentBits.MessageContent, Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildVoiceStates, Discord.GatewayIntentBits.DirectMessages
      ], partials: [
        Discord.Partials.Channel, Discord.Partials.Reaction, Discord.Partials.Message
      ], allowedMentions: {users:[],roles:[]}
    })
    this.invites = new Map();
    this.commands = new Discord.Collection();
    this.registry = [];
    this.config = importconfig as Config;
    this.embed = Discord.EmbedBuilder;
    this.collection = Discord.Collection;
    this.attachmentBuilder = Discord.AttachmentBuilder;
    this.moment = moment;
    this.xjs = xjs;
    this.userLevels = new userLevels(this);
    this.bonkCount = new bonkCount(this);
    this.punishments = new punishments(this);
    this.bannedWords = new bannedWords(this);
    this.MPServer = new MPServer(this);
    this.MPServerCache = {} as MPServerCache;
    this.suggestion = new suggestion(this);
    this.tags = new tags(this);
    this.repeatedMessages = {};
    this.setMaxListeners(62);
    this.statsGraph = -120;
  }
  async init(){
    console.time('Startup');
    await Promise.all([
      CacheServer.init(),
      DatabaseServer.init(),
      this.login((await TSClient.Token()).main)
    ]);

    const eventFiles = await Promise.all(
      readdirSync('dist/events').map(file=>import(`./events/${file}`))
    );
    eventFiles.forEach((eventFile, index)=>{
      const eventName = readdirSync('dist/events')[index].replace('.js', '');
      this.on(eventName, async(...args)=>eventFile.default.run(this, ...args));
    });

    const commandFiles = await Promise.all(
      readdirSync('dist/commands').map(file=>import(`./commands/${file}`))
    );
    commandFiles.forEach(commandFile=>{
      const {default: command} = commandFile;
      this.commands.set(command.data.name, {command, uses: 0});
      this.registry.push(command.data.toJSON());
    });

    Object.keys(this.config.MPStatsLocation).forEach(naming=>{
      this.MPServerCache[naming] = {
        players: [],
        status: null,
        name: null
      }
    });
  }
}
