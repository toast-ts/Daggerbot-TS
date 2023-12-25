interface IRepeatedMessages {
  [key:string]: {
    type:string;
    count:number;
    firstTime:number;
    timeout:NodeJS.Timeout;
  }
}
import Discord from 'discord.js';
import ConfigHelper from './helpers/ConfigHelper.js';
import {readdirSync} from 'node:fs';
import {Config} from 'src/interfaces';
import {
  DailyMsgsSvc, UserLevelsSvc, BonkCountSvc,
  MPServerSvc, PunishmentsSvc, ProhibitedWordsSvc,
  SuggestionsSvc, TagSystemSvc, YouTubeChannelsSvc
} from './models/IMPORTS.js';
import DatabaseServer from './components/DatabaseServer.js';
import CacheServer from './components/CacheServer.js';
import fxp from 'fast-xml-parser';
import dayjs from 'dayjs';
import TSClient from './helpers/TSClient.js';

export default class TClient extends Discord.Client {
  public invites: Map<any, any> = new Map();
  public commands: Discord.Collection<string, any> = new Discord.Collection();
  public registry: Discord.ApplicationCommandDataResolvable[] = [];
  public config: Config;
  public embed: typeof Discord.EmbedBuilder = Discord.EmbedBuilder;
  public collection: typeof Discord.Collection = Discord.Collection;
  public attachment: typeof Discord.AttachmentBuilder = Discord.AttachmentBuilder;
  public dayjs: typeof dayjs = dayjs;
  public fxp: typeof fxp = fxp;
  public dailyMsgs: DailyMsgsSvc = new DailyMsgsSvc();
  public userLevels: UserLevelsSvc = new UserLevelsSvc(this);
  public punishments: PunishmentsSvc = new PunishmentsSvc(this);
  public bonkCount: BonkCountSvc = new BonkCountSvc();
  public prohibitedWords: ProhibitedWordsSvc = new ProhibitedWordsSvc();
  public MPServer: MPServerSvc = new MPServerSvc();
  public suggestions: SuggestionsSvc = new SuggestionsSvc();
  public tags: TagSystemSvc = new TagSystemSvc();
  public ytChannels: YouTubeChannelsSvc = new YouTubeChannelsSvc();
  public repeatedMessages: IRepeatedMessages = {};
  public statsGraph: number = -120;

  constructor() {
    super({
      intents: [
        Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildModeration, Discord.GatewayIntentBits.GuildInvites,
        Discord.GatewayIntentBits.GuildMessageReactions, Discord.GatewayIntentBits.GuildPresences,
        Discord.GatewayIntentBits.MessageContent, Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.DirectMessages
      ], partials: [
        Discord.Partials.Channel, Discord.Partials.Reaction, Discord.Partials.Message
      ], allowedMentions: {users:[], roles:[]}
    })
    this.config = ConfigHelper.loadConfig() as Config;
    this.setMaxListeners(50);
  }
  async init() {
    console.time('Startup');

    const eventFiles = await Promise.all(readdirSync('dist/events').map(file=>import(`./events/${file}`)));
    eventFiles.forEach((eventFile, index)=>{
      const eventName = readdirSync('dist/events')[index].replace('.js', '');
      this.on(eventName, async(...args)=>eventFile.default.run(this, ...args));
    });

    const commandFiles = await Promise.all(readdirSync('dist/commands').map(file=>import(`./commands/${file}`)));
    commandFiles.forEach(commandFile=>{
      const {default: command} = commandFile;
      this.commands.set(command.data.name, {command, uses: 0});
      this.registry.push(command.data.toJSON());
    });

    await Promise.all([
      CacheServer.init(),
      DatabaseServer.init(),
      this.login((await TSClient()).main)
    ]);
  }
}
