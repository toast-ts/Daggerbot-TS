import Discord = require('discord.js');
const TClient = require('./client');
const client = new TClient;
client.init();
import fs = require('node:fs');
import ServerDB from './models/MPServer';

client.on('ready', async()=>{
    client.guilds.cache.forEach(async(e: { members: { fetch: () => any; }; })=>{await e.members.fetch()});
    setInterval(async()=>{
        client.user.setPresence({activities: [{ name: 'Running under TS', type: 0 }], status: 'online'});
        // Playing: 0, Streaming (Requires YT/Twitch URL to work): 1, Listening to: 2, Watching: 3, Competing in: 5
    }, 60000);
    setInterval(()=>{
        client.guilds.cache.get(client.config.mainServer.id).invites.fetch().then((invs: any[])=>{
            invs.forEach(async(inv: { code: any; uses: any; inviter: { id: any; }; })=>{
                client.invites.set(inv.code, {uses: inv.uses, creator: inv.inviter.id})
            })
        })
    }, 500000);
    console.log(`${client.user.tag} has logged into Discord API and now ready for operation`)
    console.log(client.config.botSwitches)
    client.channels.resolve(client.config.mainServer.channels.bot_status).send(`${client.user.username} is active`);

    // Event handler
    const eventFiles = fs.readdirSync('./events').filter(file=>file.endsWith('.js'));
    eventFiles.forEach((file)=>{
        const event = require(`./events/${file}`);
        client.on(event.name, async(...args: any)=>event.execute(client, ...args))
    });
})

// Handle errors
process.on('unhandledRejection', async(error: Error)=>{
    console.log(error)
    client.channels.resolve(client.config.mainServer.channels.errors).send({embeds: [new client.embed().setColor('#420420').setTitle('Error caught!').setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
});
process.on('uncaughtException', async(error: Error)=>{
    console.log(error)
    client.channels.resolve(client.config.mainServer.channels.errors).send({embeds: [new client.embed().setColor('#420420').setTitle('Error caught!').setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
});
process.on('error', async(error: Error)=>{
    console.log(error)
    client.channels.resolve(client.config.mainServer.channels.errors).send({embeds: [new client.embed().setColor('#420420').setTitle('Error caught!').setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
});

// Command handler
const commandFiles = fs.readdirSync('./commands').filter(file=>file.endsWith('.js'));
for (const file of commandFiles){
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command)
}
// Slash command handler todo

// Daggerwin MP loop
setInterval(async()=>{
    if (!client.config.botSwitches.mpstats) return;
    const msg = await client.channels.resolve('ChannelID').messages.fetch('MessageID')
    const embed = new client.embed();
    let Players = [];
    let Server: any;
    let CSG: void;
    let xmlData = undefined;

    // Connect to DB to retrieve the Gameserver info to fetch data.
    ServerDB.sync();
    const newServerId = client.config.mainServer.id
    const ServerURL = await ServerDB.findOne({where: {serverId: newServerId}})
    const DBURL = ServerURL.get('ip')
    const DBCode = ServerURL.get('code')
    const completedURL_DSS = DBURL + '/feed/dedicated-server-stats.json?code=' + DBCode
	const completedURL_CSG = DBURL + '/feed/dedicated-server-savegame.html?code=' + DBCode + '&file=careerSavegame'

    try {
        Server = await client.axios.get(completedURL_DSS, {timeout: 4000})
    } catch (err){
        console.log(`[${client.moment().format('DD/MM/YY HH:mm:ss')}] dag mp dss fail`)
        embed.setTitle('Data could not be retrieved, the host may not be responding.').setColor(client.config.embedColorRed)
        msg.edit({embeds: [embed]})
        return;
    }
    try {
        CSG = await client.axios.get(completedURL_CSG, {timeout: 4100}).then((xml: any)=>{
            xmlData = client.xjs.xml2js(xml.data, {compact: true, spaces: 2}).careerSavegame;
        })
    } catch (err){
        console.log(`[${client.moment().format('DD/MM/YY HH:mm:ss')}] dag mp csg fail`)
    }
    if (xmlData == undefined){
        console.log(`[${client.moment().format('DD/MM/YY HH:mm:ss')}] dag mp csg failed to convert`)
        embed.setFooter({text: 'XML Data retrieve failed. Retrying in next minute.'})
        msg.edit({embeds: [embed]})
    }

    const DB = require(`./database/MPPlayerData.json`);
    DB.push(Server.data.slots.used)
    fs.writeFileSync(__dirname + `./database/MPPlayerData.json`, JSON.stringify(DB))
    
    // Number format function
    function formatNumber(number: any, digits: any, icon: any){
        var n = Number(number)
        return n.toLocaleString(undefined, {minimumFractionDigits: digits})+icon
    }
    var timeScale = Number(xmlData?.settings?.timeScale._text)

    if (Server.data.server.name.length == 0){
        embed.setTitle('The server seems to be offline.').setColor(client.config.embedColorRed);
        msg.edit({embeds: [embed]})
    } else {
        const embed1 = new client.embed().setColor(client.config.embedColor).setTitle('Server details').addFields(
            {name: '| Current Map |', value: `${Server.data.server.mapName.length == 0 ? '\u200b' : Server.data.server.mapName}`, inline: true},
			{name: '| Game Version |', value: `${Server.data.server.version.length == 0 ? '0.0.0.0' : Server.data.server.version}`, inline: true},
			{name: '| In-game Time |', value: `${('0' + Math.floor((Server.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((Server.data.server.dayTime/60/1000)%60)).slice(-2)}`, inline: true},
			{name: '| Slot Usage |', value: `${Number(xmlData?.slotSystem?._attributes?.slotUsage).toLocaleString('en-US')}`, inline: true},
			{name: '| Timescale |', value: `${formatNumber(timeScale, 0, 'x')}`, inline: true}
        );
        await Server.data.slots.players.filter((x)=>x.isUsed !== false).forEach(player=>{
            Players.push(`**| ${player.name} | ${player.isAdmin ? 'admin |' : ''}**\nFarming for ${(Math.floor(player.uptime/60))} hr & ${('0' + (player.uptime % 60)).slice(-2)} min`)
        })
        embed.setDescription(`${Server.data.slots.used == 0 ? '*No players online*' : Players.join('\n\n')}`).setTitle(Server.data.server.name).setColor(client.config.embedColor)
        embed.setAuthor({name: `${Server.data.slots.used}/${Server.data.slots.capacity}`});
        msg.edit({embeds: [embed1, embed]})
    }
}, 60000)

// YouTube Upload notification
setInterval(async()=>{
	client.YTLoop('UCQ8k8yTDLITldfWYKDs3xFg', 'Daggerwin', '528967918772551702');
	client.YTLoop('UCguI73--UraJpso4NizXNzA', 'Machinery Restorer', '767444045520961567')
}, 300000)

// Event loop for punishments and daily msgs
setInterval(async()=>{
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
    const now = Date.now()
    const lrsStart = client.config.LRSstart;
    
    client.punishments._content.filter((x: Punishment)=>x.endTime<= now && !x.expired).forEach(async (punishment: Punishment)=>{
        console.log(`\x1b[36m[${client.moment().format('DD/MM/YY HH:mm:ss')}]`, '\x1b[32m' + `${punishment.member}\'s ${punishment.type} should expire now`);
        const unpunishResult = await client.punishments.removePunishment(punishment.id, client.user.id, 'Time\'s up!');
        console.log(`\x1b[36m[${client.moment().format('DD/MM/YY HH:mm:ss')}]`, '\x1b[32m' + unpunishResult);
    });
    
    const formattedDate = Math.floor((now - lrsStart)/1000/60/60/24);
    const dailyMsgs = require('./database/dailyMsgs.json');
    interface UserLevels {
        messages: number,
        level: number
    }
    if (!dailyMsgs.some(x=>x[0] === formattedDate)){
        let total = Object.values<UserLevels>(client.userLevels._content).reduce((a,b)=>a + b.messages, 0); // sum of all users
        const yesterday = dailyMsgs.find((x: Array<number>)=>x[0] === formattedDate - 1);
        if (total < yesterday){ // messages went down.
            total = yesterday
        }
        dailyMsgs.push([formattedDate, total]);
        fs.writeFileSync(__dirname + './database/dailyMsgs.json', JSON.stringify(dailyMsgs))
        console.log(`\x1b[36m[${client.moment().format('DD/MM/YY HH:mm:ss')}] \x1b[33m`, `Pushed [${formattedDate}, ${total}] to dailyMsgs`)
    }
}, 5000)

// Assign page number to commands
const categories = {};
while (client.commands.some(command=>!command.hidden && !command.page)){
    const command = client.commands.find(command=>!command.hidden && !command.page);
    if (!command.category) command.category = 'Misc';
    if (!categories[command.category]) categories[command.category] = {text: '', currentPage: 1}
    const commandInfo = client.commandInfo(client, command, client.helpDefaultOptions);
    if (categories[command.category].text.length+commandInfo.length>1024){
        categories[command.category].text = commandInfo;
        categories[command.category].currentPage++;
    } else {
        categories[command.category].text += commandInfo;
    }
    command.page = categories[command.category].currentPage;
}
client.categoryNames = Object.keys(categories);
delete categories;

// create pages without contents
client.commands.filter(command=>!command.hidden).forEach(command=>{
    if (!client.commandPages.some((x:any)=>x.category === command.category && x.pages === command.pages)){
        client.commandPages.push({
            name: `${command.category} - Page ${command.page}/${Math.max(...client.commands.filter((x:any)=>x.category === command.category).map((x:any)=>x.page))}`,
            category: command.category,
            page: command.page
        });
    }
});
client.commandPages.sort((a: any, b: any)=>{
    if (a.name<b.name){
        return -1;
    } else if (a.name>b.name){
        return 1;
    } else {
        return 0;
    }
});
// Punishments
interface punOpt {
    time: number,
    reason: string,
    message: any
}
interface punData {
    id: number;
    type: string;
    member: string;
    moderator: string;
    expired?: boolean;
    time?: number;
    reason?: string;
    endTime?: number;
    cancels?: number;
    duration?: number;
}
Object.assign(client.punishments,{
    createId(){
        return Math.max(...client.punishments._content.map((x: punData)=>x.id), 0) + 1;
    },
    async addPunishment(type: string, member: Discord.GuildMember, options: punOpt, moderator: string){
        const now = Date.now();
        const { time, reason, message } = options;
        const ms = import('ms');
        let timeInMillis;
        if (type !== 'mute'){
            timeInMillis = time ? ms(time) : null;
        } else {
            timeInMillis = time ? ms(time) : 2419200000;
        }
        switch (type) {
            case 'ban':
                const banData: punData = {type, id: this.createId(), member: member.id, moderator, time: now};
                let dm1;
                try {
                    dm1 = await member.send(`You've been banned from ${message.guild.name} ${timeInMillis ? `for ${client.formatTime(timeInMillis, 4, {longNames: true, commas: true})} (${timeInMillis}ms)` : 'forever'} for reason \`${reason || 'Unspecified'}\` (Case #${banData.id})`)
                } catch (err) {
                    setTimeout(()=>message.channel.send('Failed to DM user.'), 500)
                }
                const banResult = await message.guild.bans.create(member.id, {reason: `${reason || 'Unspecified'} | Case #${banData.id}`}).catch((err: Error)=>err.message);
                if (typeof banResult === 'string'){
                    dm1.delete();
                    return `Ban was unsuccessful: ${banResult}`;
                } else {
                    if (timeInMillis){
                        banData.endTime = now + timeInMillis;
                        banData.duration = timeInMillis;
                    }
                    if (reason) banData.reason = reason;
                    client.makeModlogEntry(banData, client);
                    this.addData(banData);
                    this.forceSave();
                    return new client.embed().setColor(client.config.embedColor).setTitle(`Case #${banData.id}: Ban`).setDescription(`${member.tag}\n<@${member.id}>\n(\`${member.id}\`)`).addFields(
                        {name: 'Reason', value: `\`${reason || 'Unspecified'}\``},
                        {name: 'Duration', value: `${timeInMillis ? `for ${client.formatTime(timeInMillis, 4, {longNames: true, commas: true})} (${timeInMillis}ms)` : 'forever'}`}
                    )
                }
            case 'softban':
                const guild = member.guild;
                const softbanData: punData = {type, id: this.createId(), member: member.user.id, moderator, time: now};
                const dm2 = await member.send(`You've been softbanned from ${member.guild.name} for reason \`${reason || 'Unspecified'}\` (Case #${softbanData.id})`).catch(err=>setTimeout(()=>message.channel.send(`Failed to DM <@${member.user.id}>.`), 500));
                const softbanResult = await member.ban({deleteMessageDays: 7, reason: `${reason || 'Unspecified'} | Case #${softbanData.id}`}).catch((err: Error)=>err.message);
                if (typeof softbanResult === 'string'){
                    dm2.delete();
                    return `Softban was unsuccessful: ${softbanResult}`;
                } else {
                    const unbanResult = guild.members.unban(softbanData.member, `${reason || 'Unspecified'} | Case #${softbanData.id}`).catch((err: Error)=>err.message);
                    if (typeof unbanResult === 'string'){
                        return `Softban (unban) was unsuccessful: ${softbanResult}`
                    } else {
                        if (reason) softbanData.reason = reason;
                        client.makeModlogEntry(softbanData, client);
                        this.addData(softbanData)
                        this.forceSave();
                        return new client.embed().setColor(client.config.embedColor).setTitle(`Case #${softbanData.id}: Softban`).setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`).addFields(
                            {name: 'Reason', value: `\`${reason || 'Unspecified'}\``}
                        )
                    }
                }
            case 'kick':
                const kickData: punData = {type, id: this.createId(), member: member.user.id, moderator, time: now};
                const dm3 = await member.send(`You've been kicked from ${member.guild.name} for reason \`${reason || 'Unspecified'}\` (Case #${kickData.id})`).catch((err:Error)=>setTimeout(()=>message.channel.send(`Failed to DM <@${member.user.id}>.`), 500));
                const kickResult = await member.kick(`${reason || 'Unspecified'} | Case #${kickData.id}`).catch((err:Error)=>err.message);
                if (typeof kickResult === 'string'){
                    dm3.delete();
                    return `Kick was unsuccessful: ${kickResult}`;
                } else {
                    if (reason) kickData.reason = reason;
                    client.makeModlogEntry(kickData, client);
                    this.addData(kickData);
                    this.forceSave();
                    return new client.embed().setColor(client.config.embedColor).setTitle(`Case #${kickData.id}: Kick`).setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`).addFields(
                        {name: 'Reason', value: `\`${reason || 'Unspecified'}\``}
                    )
                }
            case 'mute':
                const muteData: punData = {type, id: this.createId(), member: member.user.id, moderator, time: now};
                let muteResult;
                const dm4 = await member.send(`You've been muted in ${member.guild.name} ${timeInMillis ? `for ${client.formatTime(timeInMillis, 4, {longNames: true, commas: true})} (${timeInMillis}ms)` : 'forever'} for reason \`${reason || 'Unspecified'}\` (Case #${muteData.id})`).catch((err:Error)=>setTimeout(()=>message.channel.send('Failed to DM user.'), 500));
                if (timeInMillis){
                    muteResult = await member.timeout(timeInMillis, `${reason || 'Unspecified'} | Case #${muteData.id}`).catch((err: Error)=>err.message);
                } else {
                    muteResult = await member.timeout(2419200000, `${reason || 'Unspecified'} | Case #${muteData.id}`).catch((err: Error)=>err.message);
                }
                if (typeof muteResult === 'string') {
                    dm4.delete();
                    return `Mute was unsuccessful: ${muteResult}`;
                } else {
                    if (timeInMillis){
                        muteData.endTime = now + timeInMillis;
                        muteData.duration = timeInMillis
                    }
                    if (reason) muteData.reason = reason;
                    client.makeModlogEntry(muteData, client);
                    this.addData(muteData);
                    this.forceSave();
                    const embedm = new client.embed().setColor().setTitle(`Case #${muteData.id}: Mute`).setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`).addFields(
                        {name: 'Reason', value: `\`${reason || 'Unspecified'}\``},
                        {name: 'Duration', value: `${client.formatTime(timeInMillis, 4, {longNames: true, commas: true})} (${timeInMillis}ms)`}
                    )
                    if (moderator !== '795443537356521502') {return embedm};
                }
            case 'warn':
                const warnData: punData = {type, id: this.createId(), member: member.user.id, moderator, time: now};
                const warnResult = await member.send(`You've been warned in ${member.guild.name} for reason \`${reason || 'Unspecified'}\` (Case #${warnData.id})`).catch((err:Error)=>setTimeout(()=>message.channel.send(`Failed to DM <@${member.user.id}>.`), 500));
                if (typeof warnResult === 'string'){
                    return `Warn was unsuccessful: ${warnResult}`;
                } else {
                    if (reason) warnData.reason = reason;
                    client.makeModlogEntry(warnData, client);
                    this.addData(warnData);
                    this.forceSave();
                    const embedw = new client.embed().setColor(client.config.embedColor).setTitle(`Case #${warnData.id}: Warn`).setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`).addFields(
                        {name: 'Reason', value: `\`${reason || 'Unspecified'}\``}
                    )
                    if (moderator !== '795443537356521502') {return embedw};
                }
        }
    },
    async removePunishment(caseId: number, moderator: any, reason: string){
        const now = Date.now();
        const punishment = this._content.find((x:any)=>x.id === caseId);
        const id = this.createId();
        if (!punishment) return 'Punishment not found.';
        if (['ban', 'mute'].includes(punishment.type)){
            const guild = client.guilds.cache.get(client.config.mainServer.id) as Discord.Guild;
            let removePunishmentResult;
            if(punishment.type === 'ban'){
                // unban
                removePunishmentResult = await guild.members.unban(punishment.member, `${reason || 'Unspecified'} | Case #${id}`).catch((err: TypeError)=>err.message);
            }else if (punishment.type === 'mute') {
                //remove role
                const member = await guild.members.fetch(punishment.member).catch(err=>undefined);
                if (member){
                    removePunishmentResult = await member
                    if (typeof removePunishmentResult !== 'string'){
                        member.timeout(null, `${reason || 'Unspecified'} | Case #${id}`)
                        removePunishmentResult.send(`You've been unmuted in ${removePunishmentResult.guild.name}.`)
                        removePunishmentResult = removePunishmentResult.user; //removing a role returns a guildmember
                    }
                }else{
                    // user probably left, lets quietly nuke the punishment.
                    const removePunishmentData = {type: `un${punishment.type}`, id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now};
                    this._content[this._content.findIndex(x=>x.id === punishment.id)].expired = true;
                    this.addData(removePunishmentData).forceSave();
                }
            }
            if (typeof removePunishmentResult === 'string') return `Un${punishment.type} was unsuccessful: ${removePunishmentResult}`;
            else{
                const removePunishmentData = {type: `un${punishment.type}`, id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now};
                client.makeModlogEntry(removePunishmentData, client);
                this._content[this._content.findIndex(x=>x.id === punishment.id)].expired = true;
                this.addData(removePunishmentData).forceSave();
                return `Successfully ${punishment.type === 'ban' ? 'unbanned' : 'unmuted'} ${removePunishmentResult?.tag} (\`${removePunishmentResult?.id}\`) for reason \`${reason || 'Unspecified'}\``;
            }
        } else {
            try {
                const removePunishmentData = {type: 'removeOtherPunishment', id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now};
                client.makeModlogEntry(removePunishmentData, client);
                this._content[this._content.findIndex(x=>x.id === punishment.id)].expired = true;
                this.addData(removePunishmentData).forceSave();
                return `Successfully removed Case #${punishment.id} (type: ${punishment.type}, user: ${punishment.member}).`;
            } catch(error: Error){
                return `${punishment.type[0].toUpperCase()+punishment.type.slice(1)} removal was unsuccessful: ${error.message}`
            }
        }
    }
})