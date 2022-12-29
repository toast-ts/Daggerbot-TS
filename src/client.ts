import Discord, { Client, GatewayIntentBits, Partials } from 'discord.js';
import fs from 'node:fs';
import { Database } from './database';
import timeNames from './timeNames';
import { Punishment, formatTimeOpt, createTableOpt, punOpt, Tokens, Config } from './typings/interfaces';
import MPDB from './models/MPServer';
import axios from 'axios';
import moment from 'moment';
import tokens from './tokens.json';
import config from './config.json';
export class TClient extends Client {
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
        this.config = config as Config;
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
        this.setMaxListeners(80)
    }
    async init(){
        MPDB.sync();
        this.login(this.tokens.token_main);
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
	makeModlogEntry(data: Punishment) {
        const cancels = data.cancels ? this.client.punishments._content.find((x: Punishment) => x.id === data.cancels) : null;
        const channelId = ['kick', 'ban'].includes(data.type) ? '1048341961901363352' : this.client.config.mainServer.channels.logs;
    
        // format data into embed
        const embed = new this.client.embed()
            .setTitle(`${this.client.formatPunishmentType(data, this.client, cancels)} | Case #${data.id}`)
            .addFields(
            	{name: '🔹 User', value: `<@${data.member}> \`${data.member}\``, inline: true},
            	{name: '🔹 Moderator', value: `<@${data.moderator}> \`${data.moderator}\``, inline: true},
            	{name: '\u200b', value: '\u200b', inline: true},
            	{name: '🔹 Reason', value: `\`${data.reason}\``, inline: true})
            .setColor(this.client.config.embedColor)
            .setTimestamp(data.time)
        if (data.duration) {
            embed.addFields(
            	{name: '🔹 Duration', value: this.client.formatTime(data.duration, 100), inline: true},
            	{name: '\u200b', value: '\u200b', inline: true}
            )
        }
        if (data.cancels) embed.addFields({name: '🔹 Overwrites', value: `This case overwrites Case #${cancels.id}\n\`${cancels.reason}\``});
    
        // send embed in modlog channel
        (this.client.channels.cache.get(channelId) as Discord.TextChannel).send({embeds: [embed]});
    };
	getTense(type: string) { // Get past tense form of punishment type, grammar yes
		switch (type) {
			case 'ban':
				return 'banned';
			case 'softban':
				return 'softbanned';
			case 'kick':
				return 'kicked';
			case 'mute':
				return 'muted';
			case 'warn':
				return 'warned';
		}
	}
	async addPunishment(type: string, options: punOpt, moderator: string, reason: string, User: Discord.User, GuildMember?: Discord.GuildMember) {
		const { time, interaction } = options;
		const ms = require('ms');
		const now = Date.now();
		const guild = this.client.guilds.cache.get(this.client.config.mainServer.id) as Discord.Guild;
		const punData: Punishment = { type, id: this.createId(), member: User.id, reason, moderator, time: now }
		const embed = new this.client.embed()
			.setColor(this.client.config.embedColor)
			.setTitle(`Case #${punData.id}: ${type[0].toUpperCase() + type.slice(1)}`)
			.setDescription(`${User.tag}\n<@${User.id}>\n(\`${User.id}\`)`)
			.addFields({name: 'Reason', value: reason})
		let punResult: any;
		let timeInMillis: number;
		let DM: Discord.Message<false> | undefined;

		if (type == "mute") {
			timeInMillis = time ? ms(time) : 2419140000; // Timeouts have a limit of 4 weeks
		} else {
			timeInMillis = time ? ms(time) : null;
		}

		// Add field for duration if time is specified
		if (time) embed.addFields({name: 'Duration', value: `${timeInMillis ? `for ${this.client.formatTime(timeInMillis, 4, { longNames: true, commas: true })}` : "forever"}`})

		if (GuildMember) {
			try {
				DM = await GuildMember.send(`You've been ${this.getTense(type)} ${['warn', 'mute'].includes(type) ? 'in' : 'from'} ${guild.name}${time ? (timeInMillis ? ` for ${this.client.formatTime(timeInMillis, 4, { longNames: true, commas: true })}` : 'forever') : ''} for reason \`${reason}\` (Case #${punData.id})`);
			} catch (err: any) {
				embed.setFooter({text: 'Failed to DM member of punishment'});
			}
		}

		if (['ban', 'softban'].includes(type)) {
			const banned = await guild.bans.fetch(User.id).catch(() => undefined);
			if (!banned) {
				punResult = await guild.bans.create(User.id, {reason: `${reason} | Case #${punData.id}`}).catch((err: Error) => err.message);
			} else {
				punResult = 'User is already banned.';
			}
		} else if (type == 'kick') {
			punResult = await GuildMember?.kick(`${reason} | Case #${punData.id}`).catch((err: Error) => err.message);
		} else if (type == 'mute') {
			punResult = await GuildMember?.timeout(timeInMillis, `${reason} | Case #${punData.id}`).catch((err: Error) => err.message);
		}

		if (type == 'softban' && typeof punResult != 'string') { // If type was softban and it was successful, continue with softban (unban)
			punResult = await guild.bans.remove(User.id, `${reason} | Case #${punData.id}`).catch((err: Error) => err.message);
		}

		if (timeInMillis && ['mute', 'ban'].includes(type)) { // If type is mute or ban, specify duration and endTime
			punData.endTime = now + timeInMillis;
			punData.duration = timeInMillis;
		}

		if (typeof punResult == 'string') { // Punishment was unsuccessful
			if (DM) DM.delete();
			if (interaction) {
				return interaction.editReply(punResult);
			} else {
				return punResult;
			}
		} else { // Punishment was successful
			this.makeModlogEntry(punData);
			this.client.punishments.addData(punData).forceSave();

			if (interaction) {
				return interaction.editReply({embeds: [embed]});
			} else {
				return punResult;
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
                this.makeModlogEntry(removePunishmentData);
                this._content[this._content.findIndex((x:Punishment)=>x.id === punishment.id)].expired = true;
                this.addData(removePunishmentData).forceSave();
                return `Successfully ${punishment.type === 'ban' ? 'unbanned' : 'unmuted'} **${removePunishmentResult?.tag}** (${removePunishmentResult?.id}) for reason \`${reason || 'Reason unspecified'}\``
            }
        } else {
            try {
                const removePunishmentData = {type: 'removeOtherPunishment', id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now};
                this.makeModlogEntry(removePunishmentData);
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
                (this.client.channels.resolve(this.client.config.mainServer.channels.botcommands) as Discord.TextChannel).send({content: `<@${userid}> has reached level **${data.level}**. GG!`, allowedMentions: {parse: ['users']}})
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
