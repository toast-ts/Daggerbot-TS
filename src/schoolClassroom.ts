import TClient from './client';
import Discord from 'discord.js';
import { Database } from './database';
import { Punishment, punOpt } from './typings/interfaces';

export class bannedWords extends Database {
    client: TClient;
    constructor(client: TClient){
        super('src/database/bannedWords.json', 'array');
        this.client = client;
    }
}
export class bonkCount extends Database {
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
export class userLevels extends Database {
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
export class punishments extends Database {
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
        (this.client.channels.resolve(channelId) as Discord.TextChannel).send({embeds: [embed]});
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
				punResult = await guild.bans.create(User.id, {reason: `${reason} | Case #${punData.id}`, deleteMessageSeconds: 172800}).catch((err: Error) => err.message);
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