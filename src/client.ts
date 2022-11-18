import Discord, { Client, GatewayIntentBits, Partials } from 'discord.js';
import fs from 'node:fs';
import { Database } from './database';
import timeNames from './timeNames';
import { Punishment, formatTimeOpt, createTableOpt, punOpt } from './typings/interfaces';
export class TClient extends Client {
    invites: Map<any, any>;
    commands: Discord.Collection<string, any>;
    registry: Array<Discord.ApplicationCommandDataResolvable>;
    config: any;
    tokens: any;
    YTCache: any;
    embed: typeof Discord.EmbedBuilder;
    collection: any;
    messageCollector: any;
    attachmentBuilder: any;
    moment: any;
    xjs: any;
    axios: any;
    ms: any;
    memberCount_LastGuildFetchTimestamp: any;
    userLevels: userLevels;
    punishments: punishments;
    bonkCount: bonkCount;
    bannedWords: bannedWords;
    repeatedMessages: any;

    constructor(){
        super({
            intents: [
                GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildBans, GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages
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
        this.config = require('./config.json');
        this.tokens = require('./tokens.json');
        this.YTCache = {
            'UCQ8k8yTDLITldfWYKDs3xFg': undefined, // Daggerwin
            'UCguI73--UraJpso4NizXNzA': undefined // Machinery Restorer
        }
        this.embed = Discord.EmbedBuilder;
        this.collection = Discord.Collection;
        this.messageCollector = Discord.MessageCollector;
        this.attachmentBuilder = Discord.AttachmentBuilder;
        this.moment = require('moment');
        this.xjs = require('xml-js');
        this.axios = require('axios');
        this.ms = require('ms');
        this.memberCount_LastGuildFetchTimestamp = 0;
        this.userLevels = new userLevels(this);
        this.bonkCount = new bonkCount(this);
        this.punishments = new punishments(this);
        this.bannedWords = new bannedWords(this);
        this.repeatedMessages = {};
        this.setMaxListeners(80)
    }
    async init(){
        this.login(this.tokens.token_toast);
        this.punishments.initLoad();
        this.bannedWords.initLoad();
        this.bonkCount.initLoad();
        this.userLevels.initLoad().intervalSave(15000).disableSaveNotifs();
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
                {name: '🔹 Reason', value: `\`${data.reason || 'Reason unspecified'}\``, inline: true},
            )
        if (data.duration) {
            embed.addFields(
                {name: '🔹 Duration', value: client.formatTime(data.duration, 100), inline: true},
                {name: '\u200b', value: '\u200b', inline: true}
            )
        }
        if (data.cancels) embed.addFields({name: '🔹 Overwrites', value: `This case overwrites Case #${cancels.id}\n\`${cancels.reason}\``});
        // send embed to log channel
        (client.channels.cache.get(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [embed]})
    }

    async punish(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>, type: string){
        let result: any;
        if (!client.isStaff(interaction.member as Discord.GuildMember)) return this.youNeedRole(interaction, 'dcmod')
        //if (type !== ('warn' || 'mute') && (interaction.member as Discord.GuildMember).roles.cache.has(client.config.mainServer.roles.idk)) return this.youNeedRole(interaction, 'dcmod');
        const time = interaction.options.getString('time') as string;
        const reason = interaction.options.getString('reason') ?? 'Reason unspecified';
        if (type == 'ban'){
            const user = interaction.options.getUser('member') as Discord.User;
            if (interaction.user.id == user.id) return interaction.reply(`You cannot ${type} yourself!`);
            result = await this.punishments.addPunishment(type, user, {time,reason,interaction}, interaction.user.id);
        } else {
            const member = interaction.options.getMember('member') as Discord.GuildMember;
            if (interaction.user.id == member.id) return interaction.reply(`You cannot ${type} yourself!`);
            if (this.isStaff(member)) return interaction.reply(`You cannot ${type} other staff!`);
            result = await this.punishments.addPunishment(type, member, {time,reason,interaction}, interaction.user.id);
        }
        (typeof result == 'string' ? interaction.reply({content: `${result}`}) : interaction.reply({embeds: [result]}))
    };
    async unPunish(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        if (!client.isStaff(interaction.member as Discord.GuildMember)) return this.youNeedRole(interaction, 'dcmod');
        const punishment = this.punishments._content.find((x:Punishment)=>x.id === interaction.options.getInteger('case_id'));
        if (!punishment) return interaction.reply({content: 'Invalid Case #', ephemeral: true});
        //if (type !== ('warn' || 'mute') && (interaction.member as Discord.GuildMember).roles.cache.has(client.config.mainServer.roles.idk)) return this.youNeedRole(interaction, 'dcmod');
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
            console.log(`\x1b[36m[${this.moment().format('DD/MM/YY HH:mm:ss')}]`, `\x1b[31m${YTChannelName} YT fail`)
        }
        
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


//class
class bannedWords extends Database {
    client: TClient;
    constructor(client: TClient){
        super('src/database/bannedWords.json', 'array');
        this.client = client;
    }
}
class punishments extends Database {
    client: TClient;
    constructor(client: TClient){
        super('src/database/punishments.json', 'array');
        this.client = client;
    }
    createId(){
        return Math.max(...this.client.punishments._content.map((x:Punishment)=>x.id), 0)+1;
    }
    async addPunishment(type: string, member: any, options: punOpt, moderator: string){
        const now = Date.now();
        const {time, reason, interaction}=options;
        const ms = require('ms');
        let timeInMillis: number;
        if(type !== 'mute'){
            timeInMillis = time ? ms(time) : null;
        } else {
            timeInMillis = time ? ms(time) : 2419200000;
        }
        switch (type) {
            case 'ban':
                const banData:Punishment={type, id: this.createId(), member: member.id, moderator, time: now};
                const dm1: Discord.Message = await member.send(`You've been banned from ${interaction.guild.name} ${timeInMillis ? `for ${this.client.formatTime(timeInMillis, 4, {longNames: true, commas: true})}` : 'forever'} for reason \`${reason || 'Reason unspecified'}\` (Case #${banData.id})`).catch(()=>{return interaction.channel.send('Failed to DM user.')})
                const banResult = await interaction.guild.bans.create(member.id, {reason: `${reason || 'Reason unspecified'} | Case #${banData.id}`}).catch((err:Error)=>err.message);
                if (typeof banResult === 'string'){
                    dm1.delete()
                    return `Ban was unsuccessful: ${banResult}`
                } else {
                    if (timeInMillis){
                        banData.endTime = now + timeInMillis;
                        banData.duration = timeInMillis
                    }
                    if (reason) banData.reason = reason;
                    this.client.makeModlogEntry(banData, this.client);
                    this.addData(banData).forceSave();
                    return new this.client.embed().setColor(this.client.config.embedColor).setTitle(`Case #${banData.id}: Ban`).setDescription(`${member?.user?.tag ?? member?.tag}\n<@${member.id}>\n(\`${member.id}\`)`).addFields(
                        {name: 'Reason', value: `\`${reason || 'Reason unspecified'}\``},
                        {name: 'Duration', value: `${timeInMillis ? `for ${this.client.formatTime(timeInMillis, 4, {longNames: true, commas: true})}` : 'forever'}`}
                    )
                }
            case 'softban':
                const guild = member.guild;
                const softbanData:Punishment={type, id: this.createId(), member: member.user.id, moderator, time: now};
                const dm2 = Discord.Message = await member.send(`You've been softbanned from ${member.guild.name} ${timeInMillis ? `for ${this.client.formatTime(timeInMillis, 4, {longNames: true, commas: true})}` : 'forever'} for reason \`${reason || 'Reason unspecified'}\` (Case #${softbanData.id})`).catch(()=>{return interaction.channel.send('Failed to DM user.')})
                const softbanResult = await member.ban({deleteMessageDays: 3, reason: `${reason || 'Reason unspecified'} | Case #${softbanData.id}`}).catch((err:Error)=>err.message);
                if (typeof softbanResult === 'string') {
                    dm2.delete();
                    return `Softban was unsuccessful: ${softbanResult}`;
                } else {
                    const unbanResult = guild.members.unban(softbanData.member, `${reason || 'Reason unspecified'} | Case #${softbanData.id}`).catch((err:Error)=>err.message);
                    if (typeof unbanResult === 'string'){
                        return `Softban (unban) was unsuccessful: ${softbanResult}`
                    } else {
                        if (reason) softbanData.reason = reason;
                        this.client.makeModlogEntry(softbanData, this.client);
                        this.addData(softbanData).forceSave();
                        return new this.client.embed().setColor(this.client.config.embedColor).setTitle(`Case #${softbanData.id}: Softban`).setDescription(`${member.user.tag}\n<@${member.user.tag}>\n(\`${member.user.id}\`)`).addFields(
                            {name: 'Reason', value: `\`${reason || 'Reason unspecified'}\``}
                        )
                    }
                }
            case 'kick':
                const kickData:Punishment={type, id: this.createId(), member: member.user.id, moderator, time: now};
                const dm3: Discord.Message = await member.send(`You've been kicked from ${member.guild.name} for reason \`${reason || 'Reason unspecified'}\` (Case #${kickData.id})`).catch(()=>{interaction.channel.send(`Failed to DM <@${member.user.id}>.`); return null});
                const kickResult = await member.kick(`${reason || 'Reason unspecified'} | Case #${kickData.id}`).catch((err:Error)=>err.message)
                if (typeof kickResult === 'string'){
                    if (dm3) dm3.delete();
                    return `Kick was unsuccessful: ${kickResult}`
                } else {
                    if (reason) kickData.reason = reason;
                    this.client.makeModlogEntry(kickData, this.client);
                    this.addData(kickData).forceSave();
                    return new this.client.embed().setColor(this.client.config.embedColor).setTitle(`Case #${kickData.id}: Kick`).setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`).addFields(
                        {name: 'Reason', value: `\`${reason || 'Reason unspecified'}\``}
                    )
                }
            case 'warn':
                const warnData:Punishment={type, id: this.createId(), member: member.user.id, moderator, time: now};
                const warnResult: Discord.Message = await member.send(`You've been warned in ${member.guild.name} for reason \`${reason || 'Reason unspecified'}\` (Case #${warnData.id})`).catch(()=>{interaction.channel.send(`Failed to DM <@${member.user.id}>`); return null;})
                if (typeof warnResult === 'string'){
                    return `Warn was unsuccessful: ${warnResult}`
                } else {
                    if (reason) warnData.reason = reason;
                    this.client.makeModlogEntry(warnData, this.client);
                    this.addData(warnData).forceSave();
                    const embedw = new this.client.embed().setColor(this.client.config.embedColor).setTitle(`Case #${warnData.id}: Warn`).setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`).addFields(
                        {name: 'Reason', value: `\`${reason || 'Reason unspecified'}\``}
                    )
                    if (moderator !== '795443537356521502') {return embedw}
                }
            case 'mute':
                const muteData:Punishment={type, id: this.createId(), member: member.user.id, moderator, time: now};
                let muteResult;
                if (this.client.isStaff(member)) return 'Staff cannot be muted.'
                const dm4: Discord.Message = await member.send(`You've been muted in ${member.guild.name} ${timeInMillis ? `for ${this.client.formatTime(timeInMillis, 4, {longNames: true, commas: true})}` : 'forever'} for reason \`${reason || 'Reason unspecified'}\` (Case #${muteData.id})`).catch(()=>{interaction.channel.send('Failed to DM user.'); return null});
                if (timeInMillis) {
                    muteResult = await member.timeout(timeInMillis, `${reason || 'Reason unspecified'} | Case #${muteData.id}`).catch((err:Error)=>err.message);
                } else {
                    muteResult = await member.timeout(2419200000, `${reason || 'Reason unspecified'} | Case #${muteData.id}`).catch((err:Error)=>err.message);
                }
                if (typeof muteResult === 'string'){
                    if (dm4) dm4.delete();
                    return `Mute was unsuccessful: ${muteResult}`;
                } else {
                    if (timeInMillis) {
                        muteData.endTime = now + timeInMillis;
                        muteData.duration = timeInMillis;
                    }
                    if (reason) muteData.reason = reason;
                    this.client.makeModlogEntry(muteData, this.client);
                    this.addData(muteData).forceSave();
                    const embedm = new this.client.embed().setColor(this.client.config.embedColor).setTitle(`Case #${muteData.id}: Mute`).setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`).addFields(
                        {name: 'Reason', value: `\`${reason || 'Reason unspecified'}\``},
                        {name: 'Duration', value: `${this.client.formatTime(timeInMillis, 4, {longNames: true, commas: true})}`})
                    if (moderator !== '795443537356521502') {return embedm};
                }
        }
    }
    async removePunishment(caseId:number, moderator:any, reason:string):Promise<any>{
        const now = Date.now()
        const punishment = this._content.find((x:Punishment)=>x.id === caseId);
        const id = this.createId();
        if (!punishment) return 'Punishment not found';
        if (['ban','mute'].includes(punishment.type)) {
            const guild = this.client.guilds.cache.get(this.client.config.mainServer.id) as Discord.Guild;
            let removePunishmentResult;
            if (punishment.type === 'ban'){
                removePunishmentResult = await guild.members.unban(punishment.member, `${reason || 'Reason unspecified'} | Case #${id}`).catch((err:TypeError)=>err.message);
            } else if (punishment.type === 'mute'){
                const member = await guild.members.fetch(punishment.member).catch(err=>undefined);
                if (member){
                    removePunishmentResult = await member
                    if (typeof removePunishmentResult !== 'string'){
                        member.timeout(null, `${reason || 'Reason unspecified'} | Case #${id}`)
                        removePunishmentResult.send(`You've been unmuted in ${removePunishmentResult.guild.name}.`);
                        removePunishmentResult = removePunishmentResult.user;
                    }
                } else {
                    // user probably left, quietly remove punishment
                    const removePunishmentData = {type: `un${punishment.type}`, id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now};
                    this._content[this._content.findIndex((x:Punishment)=>x.id === punishment.id)].expired = true
                    this.addData(removePunishmentData).forceSave();
                }
            }
            if (typeof removePunishmentResult === 'string') return `Un${punishment.type} was unsuccessful: ${removePunishmentResult}`;
            else {
                const removePunishmentData = {type: `un${punishment.type}`, id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now};
                this.client.makeModlogEntry(removePunishmentData, this.client);
                this._content[this._content.findIndex((x:Punishment)=>x.id === punishment.id)].expired = true;
                this.addData(removePunishmentData).forceSave();
                return `Successfully ${punishment.type === 'ban' ? 'unbanned' : 'unmuted'} **${removePunishmentResult?.tag}** (${removePunishmentResult?.id}) for reason \`${reason || 'Reason unspecified'}\``
            }
        } else {
            try {
                const removePunishmentData = {type: 'removeOtherPunishment', id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now};
                this.client.makeModlogEntry(removePunishmentData, this.client);
                this._content[this._content.findIndex((x:Punishment)=>x.id === punishment.id)].expired = true;
                this.addData(removePunishmentData).forceSave();
                return `Successfully removed Case #${punishment.id} (type: ${punishment.type}, user: ${punishment.member}).`;
            } catch (error:any){
                return `${punishment.type[0].toUpperCase() + punishment.type.slice(1)} removal was unsuccessful: ${error.message}`;
            }
        }
    }
}
class userLevels extends Database {
    client: TClient;
    constructor(client: TClient){
        super('src/database/userLevels.json', 'object');
        this.client = client
    }
    incrementUser(userid: string){
        const data = this._content[userid];// User's data. Integer for old format, object for new format.

        if (typeof data == 'number'){// If user's data is an integer, convert it into object for new format.
            this._content[userid] = {messages: data, level: 0};
        }

        if (data) {// If user exists on file...
            this._content[userid].messages++;// Increment their message count
            if (data.messages >= this.algorithm(data.level+2)){// Quietly level up users who can surpass more than 2 levels at once, usually due to manually updating their message count
                while (data.messages > this.algorithm(data.level+1)){
                    this._content[userid].level++;
                    console.log(`${userid} EXTENDED LEVELUP ${this._content[userid].level}`)
                }
            } else if (data.messages >= this.algorithm(data.level+1)){// If user's message count meets/exceeds message requirement for next level...
                this._content[userid].level++;// Level them up.
                (this.client.channels.resolve(this.client.config.mainServer.channels.thismeanswar) as Discord.TextChannel).send({content: `<@${userid}> has reached level **${data.level}**. GG!`, allowedMentions: {parse: ['users']}})
            }
        } else {// If user doesn't exist on file, create an object for it.
            this._content[userid] = {messages: 1, level: 0};
        }
    }
    algorithm(level: number){// Algorithm for determining levels. If adjusting, recommended to only change the integer at the end of equation.
        return level*level*15;
    }
}
class bonkCount extends Database {
    client: TClient;
    constructor(client: TClient){
        super('src/database/bonkCount.json', 'object')
        this.client = client
    }
    _incrementUser(userid: string){
        const amount = this._content[userid];
        if(amount) this._content[userid]++;
        else this._content[userid] = 1;
        return this;
    }
    getUser(userid: string){
        return this._content[userid] || 0;
    }
}