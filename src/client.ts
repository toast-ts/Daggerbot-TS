interface IRepeatedMessages {
  [key:string]: {
    type:string;
    count:number;
    firstTime:number;
    timeout:NodeJS.Timeout;
  }
}
interface ICrosspostSpam {
  [key:string]: {
    message:string;
    channelId:string[];
  }
}
import Discord from 'discord.js';
import ConfigHelper from './helpers/ConfigHelper.js';
import {readdirSync} from 'node:fs';
import {Config} from 'src/interfaces';
import {
  DailyMsgsSvc, UserLevelsSvc,
  MPServerSvc, PunishmentsSvc, ProhibitedWordsSvc,
  SuggestionsSvc, TagSystemSvc, YouTubeChannelsSvc
} from './models/IMPORTS.js';
import DatabaseServer from './components/DatabaseServer.js';
import CacheServer from './components/CacheServer.js';
import TSClient from './helpers/TSClient.js';

export default class TClient extends Discord.Client {
  public invites: Map<any, any> = new Map();
  public commands: Discord.Collection<string, any> = new Discord.Collection();
  public registry: Discord.ApplicationCommandDataResolvable[] = [];
  public config: Config;
  public embed: typeof Discord.EmbedBuilder = Discord.EmbedBuilder;
  public collection: typeof Discord.Collection = Discord.Collection;
  public attachment: typeof Discord.AttachmentBuilder = Discord.AttachmentBuilder;
  public dailyMsgs: DailyMsgsSvc = new DailyMsgsSvc();
  public userLevels: UserLevelsSvc = new UserLevelsSvc(this);
  public punishments: PunishmentsSvc = new PunishmentsSvc(this);
  public prohibitedWords: ProhibitedWordsSvc = new ProhibitedWordsSvc();
  public MPServer: MPServerSvc = new MPServerSvc();
  public suggestions: SuggestionsSvc = new SuggestionsSvc();
  public tags: TagSystemSvc = new TagSystemSvc();
  public ytChannels: YouTubeChannelsSvc = new YouTubeChannelsSvc();
  public repeatedMessages: IRepeatedMessages = {};
  public crosspostSpam: ICrosspostSpam = {};
  public memberJoinDates: Map<Discord.Snowflake, string> = new Map();

  constructor() {
    super({
      intents: [
        Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildModeration, Discord.GatewayIntentBits.GuildInvites,
        Discord.GatewayIntentBits.GuildPresences, Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMessages, Discord.GatewayIntentBits.DirectMessages
      ],
      partials: [
        Discord.Partials.Message, Discord.Partials.Channel
      ],
      allowedMentions: {users:[], roles:[]}
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
