import Discord, { Client, GatewayIntentBits, Partials } from 'discord.js';
import fs from 'node:fs';
import timeNames from './timeNames';
import { Punishment, formatTimeOpt, Tokens, Config } from './typings/interfaces';
import { bannedWords, bonkCount, userLevels, punishments } from './schoolClassroom';
import MPDB from './models/MPServer';
import axios from 'axios';
import moment from 'moment';
import tokens from './tokens.json';

let importconfig:Config
try{
    importconfig = require('./DB-Beta.config.json')
    console.log('Using development config : Daggerbot Beta')
    //importconfig = require('./Toast-Testbot.config.json')
    //console.log('Using development config : Toast-Testbot')
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
    repeatedMessages: any;
    statsGraph: number;

    constructor(){
        super({
            intents: [
                GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildBans, GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildPresences, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages
            ],
            partials: [
                Partials.Channel,
                Partials.Reaction,
                Partials.Message
            ],
            allowedMentions: { users: [], roles: [] }
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
        this.repeatedMessages = {};
        this.setMaxListeners(80);
        this.statsGraph = -60;
    }
    async init(){
        MPDB.sync();
        this.login(this.tokens.token_main);
        this.punishments.initLoad();
        this.bannedWords.initLoad();
        this.bonkCount.initLoad();
        this.userLevels.initLoad().intervalSave(30000).disableSaveNotifs();
        const commandFiles = fs.readdirSync('src/commands').filter(file=>file.endsWith('.ts'));
        for (const file of commandFiles){
            const command = require(`./commands/${file}`);
            this.commands.set(command.default.data.name, command)
            this.registry.push(command.default.data.toJSON())
        }
    }
    formatPunishmentType(punishment: Punishment, client: TClient, cancels?: Punishment){
        if (punishment.type == 'removeOtherPunishment'){
            cancels ||= this.punishments._content.find((x: Punishment)=>x.id === punishment.cancels)
            return cancels.type[0].toUpperCase()+cancels.type.slice(1)+' Removed';
        } else return punishment.type[0].toUpperCase()+punishment.type.slice(1);
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
            } else {
                break;
            }
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
    isStaff(guildMember: Discord.GuildMember){
        return this.config.mainServer.staffRoles.map((x: string)=>this.config.mainServer.roles[x]).some((x: string)=>guildMember.roles.cache.has(x))
    }
    youNeedRole(interaction: Discord.CommandInteraction, role:string){
        return interaction.reply(`This command is restricted to <@&${this.config.mainServer.roles[role]}>`)
    }
    alignText(text: string, length: number, alignment: string, emptyChar = ' '){
        if (alignment == 'right'){
            text = emptyChar.repeat(length - text.length)+text;
        } else if (alignment == 'middle'){
            const emptyCharsPerSide = (length - text.length)/2;
            text = emptyChar.repeat(Math.floor(emptyCharsPerSide))+text+emptyChar.repeat(Math.floor(emptyCharsPerSide));
        } else {
            text = text + emptyChar.repeat(length - text.length);
        } return text;
    }
    async punish(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>, type: string){
        if (!client.isStaff(interaction.member as Discord.GuildMember)) return client.youNeedRole(interaction, "dcmod");

        const time = interaction.options.getString('time') as string;
        const reason = interaction.options.getString('reason') ?? 'Reason unspecified';
        const GuildMember = interaction.options.getMember('member') as Discord.GuildMember;
        const User = interaction.options.getUser('member') as Discord.User;

        if (interaction.user.id == User.id) return interaction.reply(`You cannot ${type} yourself.`);
        if (!GuildMember && type != 'ban') return interaction.reply(`You cannot ${type} someone who is not in the server.`);


        await interaction.deferReply();
        await client.punishments.addPunishment(type, { time, interaction }, interaction.user.id, reason, User, GuildMember);
    };
    async unPunish(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        if (!client.isStaff(interaction.member as Discord.GuildMember)) return this.youNeedRole(interaction, 'dcmod');
        const punishment = this.punishments._content.find((x:Punishment)=>x.id === interaction.options.getInteger('case_id'));
        if (!punishment) return interaction.reply({content: 'Invalid Case #', ephemeral: true});
        const reason = interaction.options.getString('reason') ?? 'Reason unspecified';
        const unpunishResult = await this.punishments.removePunishment(punishment.id, interaction.user.id, reason);
        interaction.reply(unpunishResult)
    }
    async YTLoop(YTChannelID: string, YTChannelName: string, DCChannelID: string){
        let Data:any;
        let error;

        try {
            await this.axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${YTChannelID}`, {timeout: 5000}).then((xml:any)=>{
                Data = this.xjs.xml2js(xml.data, {compact: true, spaces: 2});
            })
        } catch(err){
            error = true;
            console.log(`[${this.moment().format('DD/MM/YY HH:mm:ss')}]`, `${YTChannelName} YT fail`)
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
