import { Client, GatewayIntentBits, Partials } from 'discord.js';
import Discord = require('discord.js');
import fs = require('node:fs');
import database from './database';
import timeNames from './timeNames.js';
class TClient extends Client {
    invites: any;
    commands: any;
    config: any;
    tokens: any;
    categoryNames: any;
    commandPages: any;
    helpDefaultOptions: any;
    YTCache: any;
    embed: any;
    collection: any;
    messageCollector: any;
    attachmentBuilder: any;
    moment: any;
    memberCount_LastGuildFetchTimestamp: any;
    userLevels: any;
    punishments: any;
    bonkCount: any;
    bannedWords: any;
    repeatedMessages: any;
    setMaxListeners: any;

    constructor(){
        super({
            intents: [
                GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildBans, GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent
            ],
            partials: [
                Partials.Channel,
                Partials.Reaction,
                Partials.Message
            ],
            allowedMentions: { repliedUser: false }
        })
        this.invites = new Map();
        this.commands = new Discord.Collection();
        this.config = require('./config.json');
        this.tokens = require('./tokens.json');
        this.categoryNames;
        this.commandPages = [];
        this.helpDefaultOptions = {
            parts: ['name', 'usage', 'shortDescription', 'alias'],
            titles: ['alias']
        }
        this.YTCache = {
            'UCQ8k8yTDLITldfWYKDs3xFg': undefined, // Daggerwin
            'UCguI73--UraJpso4NizXNzA': undefined // Machinery Restorer
        }
        this.embed = Discord.EmbedBuilder;
        this.collection = Discord.Collection;
        this.messageCollector = Discord.MessageCollector;
        this.attachmentBuilder = Discord.AttachmentBuilder;
        this.moment = require('moment');
        this.memberCount_LastGuildFetchTimestamp = 0;
        this.userLevels = new database('./database/userLevels.json', 'object');
        this.bonkCount = new database('./database/bonkCount.json', 'object');
        this.punishments = new database('./database/punishments.json', 'array');
        this.bannedWords = new database('./database/bannedWords.json', 'array');
        this.repeatedMessages = {};
        this.setMaxListeners(20)
    }
    async init(){
        this.login(this.tokens.token_toast);
        this.punishments.initLoad();
        this.bannedWords.initLoad();
        this.bonkCount.initLoad();
        this.userLevels.initLoad().intervalSave(15000).disableSaveNotifs();
    }
    formatPunishmentType(punishment: any, client: any, cancels: any){
        if (punishment.type == 'removeOtherPunishment'){
            cancels ||= this.punishments._content.find(x=>x.id === punishment.cancels)
            return cancels.type[0].toUpperCase()+cancels.type.slice(1)+' Removed';
        } else return punishment.type[0].toUpperCase()+punishment.type.slice(1);
    }
    formatTime(integer: number, accuracy = 1, options = {}){
        let achievedAccuracy = 0;
        let text = '';
        const { longNames, commas } = options
        for (const timeName of timeNames){
            if (achievedAccuracy < accuracy){
                const fullTimelengths = Math.floor(integer/timeName.length);
                if (fullTimelengths == 0) continue;
                achievedAccuracy++;
                text += fullTimelengths + (longNames ? (' '+timeName.name+(fullTimelengths === 1 ? '' : 's')) : timeName.name.slice(0, timeName.name === 'month' ? 2 : 1)) + (commas ? ', ' : ' ');
                integer -= fullTimelengths*timeName.length;
            } else {
                break;
            }
        }
        if (text.length == 0) text = integer + (longNames ? ' milliseconds' : 'ms') + (commas ? ', ' : '');
        if (commas){
            text = text.slice(0, -2);
            if (longNames){
                text = text.split('');
                text[text.lastIndexOf(',')] = ' and';
                text = text.join('');
            }
        } return text.trim();
    }
}
module.exports = TClient;

export function init() {
    throw new Error('Function not implemented.');
}
