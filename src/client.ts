interface createTableOpt {
    columnAlign: any,
    columnSeparator: any,
    columnEmptyChar: any
}
interface formatTimeOpt {
    longNames: boolean,
    commas: boolean
}
interface Punishment {
    id: number;
    type: string;
    member: string;
    moderator: string;
    expired?: boolean;
    time?: number;
    reason: string;
    endTime?: number;
    cancels?: number;
    duration?: number;
}
interface CommandInfoOpt {
    insertNewline: boolean,
    parts: string[], //idfk
    titles: string[]
}
import Discord, { Client, GatewayIntentBits, Partials } from 'discord.js';
import fs from 'node:fs';
import { Database } from './database';
import timeNames from './timeNames.js';
export class TClient extends Client {
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
    xjs: any;
    axios: any;
    memberCount_LastGuildFetchTimestamp: any;
    userLevels: Database;
    punishments: Database;
    bonkCount: Database;
    bannedWords: Database;
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
            allowedMentions: { repliedUser: false, parse: ['roles', 'users'] }
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
        this.moment = import('moment');
        this.xjs = import('xml-js');
        this.axios = import('axios');
        this.memberCount_LastGuildFetchTimestamp = 0;
        this.userLevels = new Database('./database/userLevels.json', 'object');
        this.bonkCount = new Database('./database/bonkCount.json', 'object');
        this.punishments = new Database('./database/punishments.json', 'array');
        this.bannedWords = new Database('./database/bannedWords.json', 'array');
        this.repeatedMessages = {};
        this.setMaxListeners(80)
    }
    async init(){
        this.login(this.tokens.token_toast);
        this.punishments.initLoad();
        this.bannedWords.initLoad();
        this.bonkCount.initLoad();
        this.userLevels.initLoad().intervalSave(15000).disableSaveNotifs();
    }
    commandInfo(client: TClient, command: any, options?: CommandInfoOpt){
        let text = ':small_orange_diamond: ';
        if (!options.titles) options.titles = [];
        function e(){
            text += '\n';
            if (options.insertNewline){
                text += '\n';
            } return;
        }
        if (options.parts.includes('name') && command.name){
            if (options.titles.includes('name') && options.titles.includes('usage')){
                text += 'Name & Usage: ';
            } else if (options.titles.includes('name')){
                text += 'Name: ';
            }
            text += '`' + client.config.prefix + command.name;
            if (options.parts.includes('usage') && command.usage){
                text += ' ' + command.usage.map((x:string)=>x.startsWith('?') ? '?['+x.slice(1)+']' : '['+x+']').join(' ');
            }
            text += '`';
            e();
        } else if (options.parts.includes('usage') && command.usage){
            if (options.titles.includes('usage')) text += 'Usage: ';
            text += '`'+command.usage.map((x:string)=>x.startsWith('?') ? '?['+x+']' : '['+x+']').join(' ') + '`';
            e();
        }
        if (options.parts.includes('description') && command.description){
            if (options.titles.includes('description')) text += 'Description: ';
            text += command.description;
            e();
        }
        if (options.parts.includes('shortDescription')){
            if (command.shortDescription){
                if (options.titles.includes('shortDescription')) text += 'Shorter description: ';
                text += command.shortDescription;
                e();
            } else if (!options.titles.includes('shortDescription') && command.description){
                text += command.description;
                e();
            }
        }
        if (options.parts.includes('alias') && command.alias){
            if (options.titles.includes('alias')) text += 'Aliases: ';
            text += command.alias.map((x:any)=>'`'+x+'`').join(', ');
            e();
        }
        if (options.parts.includes('category') && command.category){
            if (options.titles.includes('category')) text += 'Category: ';
            text += command.category;
            e();
        }
        if (options.parts.includes('autores') && command.autores){
            if (options.titles.includes('autores')) text += 'AutoResponse:tm: Requirements: ';
            text += '`['+command.autores.join('] [')+']`';
            e();
        }
        e();
        return text;
    }
    formatPunishmentType(punishment: Punishment, client: TClient, cancels: Punishment){
        if (punishment.type == 'removeOtherPunishment'){
            cancels ||= this.punishments._content.find((x: Punishment)=>x.id === punishment.cancels)
            return cancels.type[0].toUpperCase()+cancels.type.slice(1)+' Removed';
        } else return punishment.type[0].toUpperCase()+punishment.type.slice(1);
    }
    formatTime(integer: number, accuracy = 1, options?: formatTimeOpt){
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
    createTable(columnTitles = [], rowsData = [], options: createTableOpt, client: TClient){
        const rows: any = [];
        let { columnAlign = [], columnSeparator = [], columnEmptyChar = [] } = options;
        if (columnSeparator.length < 1) columnSeparator.push('|');
        columnSeparator = columnSeparator.map((x: string)=>`${x}`);
        // col widths
        const columnWidths = columnTitles.map((title: any, i)=>Math.max(title.length, ...rowsData.map((x: any)=>x[i].length)));
        // first row
        rows.push(columnTitles.map((title, i)=>{
            let text = client.alignText(title, columnWidths[i], columnAlign[i], columnEmptyChar[i]);
            if (columnSeparator[i]){
                text += ' '.repeat(columnSeparator[i].length);
            }
            return text;
        }).join(''))
        // big line
        rows.push('━'.repeat(rows[0].length));
        //data
        // remove unicode
        rowsData.map((row: any)=>{
            return row.map((element: string)=>{
                return element.split('').map((char: string)=>{
                    if (char.charCodeAt(0)>128) return '□';
                }).join('')
            })
        })
        rows.push(rowsData.map((row: any)=>row.map((element: string, i: number)=>{
                return client.alignText(element, columnWidths[i], columnEmptyChar[i])+(i === columnTitles.length - 1 ? '' : columnSeparator[i]);
            }).join('')
        ).join('\n'))

        return rows.join('\n');
    }
    makeModlogEntry(data: Punishment, client: TClient){
        const cancels = data.cancels ? client.punishments._content.find((x: Punishment)=>x.id === data.cancels) : null;

        // turn data into embed
        const embed = new this.embed().setColor(this.config.embedColor).setTimestamp(data.time)
            .setTitle(`${this.formatPunishmentType(data, client, cancels)} | Case #${data.id}`).addFields(
                {name: '🔹 User', value: `<@${data.member}> \`${data.member}\``, inline: true},
                {name: '🔹 Moderator', value: `<@${data.moderator}> \`${data.moderator}\``, inline: true},
                {name: '\u200b', value: `\u200b`, inline: true},
                {name: '🔹 Reason', value: `\`${data.reason || 'Unspecified'}\``, inline: true},
            )
        if (data.duration) {
            embed.addFields(
                {name: '🔹 Duration', value: client.formatTime(data.duration, 100), inline: true},
                {name: '\u200b', value: '\u200b', inline: true}
            )
        }
        if (data.cancels) embed.addFields({name: '🔹 Overwrites', value: `This case overwrites Case #${cancels.id} \`${cancels.reason}\``})
        // send embed to log channel
        (client.channels.cache.get(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [embed]})
    }
    async punish(client: TClient, message: Discord.Message, args: string, type: string){
        let member: any;
        if (message.guildId !== client.config.mainServer.id) return message.channel.send('This command doesn\'t work in this server');
        if (!message.member.roles.cache.has(client.config.mainServer.roles.dcmod)) return message.reply(`You need the <@&${client.config.mainServer.roles.dcmod}> role to use this command.`)
        if (type == 'ban' && args[1]){
            member = message.mentions.users?.first() || (await client.users.fetch(args[1]).catch(()=>undefined));
        } else if (args[1]){
            member = message.mentions.members?.first() || (await message.guild.members.fetch(args[1]).catch(()=>undefined));
        }
        let memberAsked = false;
        if (!member){
            memberAsked = true;
            await message.channel.send(`Which member would you like to ${type}?\nSend another message with a mention or a user ID. (30s)`).then(async (x:any)=>{
                const filter = m=>m.author.id == message.author.id;
                member = await message.channel.awaitMessages({filter, time: 30000, errors: ['time'], max: 1}).then(async (z:any)=>{
                    if (z.first().content.startsWith(client.config.prefix)) return 'timedout';
                    if (type == 'ban'){
                        return z.first().mentions.users?.first() || (await client.users.fetch(z.first().content).catch(()=>undefined));
                    } else {
                        return z.first().mentions.members?.first() || (await message.guild.members.fetch(z.first().content).catch(()=>undefined))
                    }
                }).catch(async()=>{
                    message.channel.send('Command cancelled after 30 seconds of inactivity.');
                    return 'timedout';
                });
            })
        }
        if (member === 'timedout') return;
        else if (!member) return message.channel.send('You failed to mention a member.');
        let time;
        let reason;
        let col1; // idfk if this should be included here but just wanted to get rid of red underline.
        let result: any;
        if (args[2] && !memberAsked){
            // if the first character of args 2 is a number, args 2 is the time. otherwise its the reason.
            time = (args[2][0].match(/[0-9]/) && !['softban', 'kick', 'warn'].includes(type)) ? args[2] : undefined;
            // if time is in args 2, reason starts at args 3. if no time was provided, reason starts at args 2
            reason = args.slice(time ? 3 : 2).join(' '); // "Property 'join' does not exist on type 'string'." :linus: x99
        } else {
            if (!['softban', 'kick', 'warn'].includes(type)){
                await message.channel.send(`How long do you want to ${type} this user for?\nSend another message with a time name, or 'forever' to ${type} this user forever. (30s)`);
                const filter = m=>m.author.id === message.author.id;
                col1 = await message.channel.awaitMessages({filter, time: 30000, errors: ['time'], max: 1}).then(collected=>{
                    if (collected.first()?.content.startsWith(client.config.prefix)) return 'timedout';
                    return collected.first()?.content.toLowerCase() === 'forever' ? 'inf' : collected.first()?.content;
                }).catch(()=>{
                    message.channel.send('Command cancelled after 30 seconds of inactivity.');
                    return 'timedout';
                });
                if (time === 'timedout') return;
            }
            await message.channel.send(`Send another message with a reason for this ${type}.\nSend another message with "-" to leave the reason unspecified. (30s)`);
            const filter = m=>m.author.id === message.author.id;
            reason = await message.channel.awaitMessages({filter, time: 30000, errors: ['time'], max: 1}).then(collected=>{
                if (collected.first()?.content.startsWith(client.config)) return 0;
                return collected.first()?.content == '-' ? undefined : collected.first()?.content;
            }).catch(()=>{
                message.channel.send('Command cancelled after 30 seconds of inactivity.');
                return 0;
            })
            if (reason === 0) return;
        }
        const punishmentResult = await client.punishments.addPunishment(type, member, {time, reason}, message.author.id, message);
        (typeof result == 'string' ? message.reply(punishmentResult) : message.reply({embeds: [punishmentResult]}))
    };
    async unPunish(client: TClient, message: Discord.Message, args: string){
        if (message.guildId !== client.config.mainServer.id) return message.channel.send('This command doesn\'t work in this server');
        if (!message.member.roles.cache.has(client.config.mainServer.roles.dcmod)) return message.reply(`You need the <@&${client.config.mainServer.roles.dcmod}> role to use this command.`)
        let punishment;
        if (args[1]) punishment = client.punishments._content.find((x:any)=>x.id == args[1])
        if (!punishment){
            await message.channel.send(`Which punishment would you like to remove?\nSend another message with a Case # (30s)`).then(async (x:any)=>{
                const filter = m=>m.author.id === message.author.id;
                punishment = await message.channel.awaitMessages({filter, time: 30000, errors: ['time'], max: 1}).then(async (z:any)=>{
                    return client.punishments._content.find((x:any)=>x.id == z.first()?.content);
                }).catch(async()=>{
                    message.channel.send('Command cancelled after 30 seconds of inactivity.');
                    return 'timedout';
                });
            })
        }
        if (punishment === 'timedout') return;
        else if (!punishment) return message.channel.send('You failed to mention a Case #');
        //if (punishment.type !== 'warn' && message.member.roles.cache.has(client.config.mainServer.roles.trialmoderator)) return message.channel.send('Trial moderators can only remove warnings.');
        let reason;
        if (args[2]){
            reason = args.slice(2).join(' '); // "Property 'join' does not exist on type 'string'." :linus: x50
        }else{
            await message.channel.send(`Send another message with a reason for this ${punishment.type} removal. (30s)\n*Send \`-\` to leave the reason unspecified.*`);
            const filter = m=>m.author.id === message.author.id;
            reason = await message.channel.awaitMessages({filter, time: 30000, errors: ['time'], max: 1}).then(collected=>collected.first()?.content === '-' ? undefined : collected.first()?.content).catch(()=>0);
            if (reason === 0) return message.channel.send('Invalid reason.');
        }
        const unpunishResult = await client.punishments.removePunishment(punishment.id, message.author.id, reason);
        message.channel.send(unpunishResult);
    }
    async YTLoop(YTChannelID: string, YTChannelName: string, DCChannelID: string){
        const Data = this.xjs.xml2js((await this.axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${YTChannelID}`, {timeout: 5000})), {compact: true, spaces: 2}).catch(()=>{return null});
        if (!Data) return;
        if (this.YTCache[YTChannelID] == undefined){
            this.YTCache[YTChannelID] = Data.feed.entry[0]['yt:videoId']._text;
            return;
        }
        if (Data.feed.entry[1]['yt:videoId']._text == this.YTCache[YTChannelID]){
            this.YTCache[YTChannelID] = Data.feed.entry[0]['yt:videoId']._text
            (this.channels.resolve(DCChannelID) as Discord.TextChannel).send(`**${YTChannelName}** just uploaded a video!\n${Data.feed.entry[0].link._attributes.href}`)
        }
    }
}