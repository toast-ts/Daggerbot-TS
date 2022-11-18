import Discord from 'discord.js';
import { TClient } from './client';
const client = new TClient;
client.init();
import fs from 'node:fs';
import MPDB from './models/MPServer';
import { Punishment, punOpt } from './typings/interfaces';

client.on('ready', async()=>{
    client.guilds.cache.forEach(async(e: { members: { fetch: () => any; }; })=>{await e.members.fetch()});
    setInterval(async()=>{
        client.user.setPresence({activities: [{ name: 'Slash commands!', type: 0 }], status: 'online'});
        // Playing: 0, Streaming (Requires YT/Twitch URL to work): 1, Listening to: 2, Watching: 3, Competing in: 5
    }, 60000);
    if (client.config.botSwitches.registerCommands) (client.guilds.cache.get(client.config.mainServer.id) as Discord.Guild).commands.set(client.registry).catch((e)=>{console.log(`Couldn't register slash commands: ${e}`)})
    setInterval(()=>{
        const guild = client.guilds.cache.get(client.config.mainServer.id) as Discord.Guild;
        guild.invites.fetch().then((invs)=>{
            invs.forEach(async(inv)=>{
                client.invites.set(inv.code, {uses: inv.uses, creator: inv.inviterId})
            })
        })
    }, 500000);
    console.log(`${client.user.tag} has logged into Discord API and now ready for operation`);
    console.log(client.config.botSwitches);
    //(client.channels.resolve(client.config.mainServer.channels.bot_status) as Discord.TextChannel).send(`${client.user.username} is active\n\`\`\`json\n${Object.entries(client.config.botSwitches).map((hi)=>`${hi[0]}: ${hi[1]}`).join('\n')}\`\`\``);

    // Event handler
    const eventFiles = fs.readdirSync('src/events').filter(file=>file.endsWith('.ts'));
    eventFiles.forEach((file)=>{
        const event = require(`./events/${file}`);
        client.on(event.default.name, async(...args)=>event.default.execute(client, ...args));
    });
})

// Handle errors
process.on('unhandledRejection', async(error: Error)=>{
    console.log(error);
    //(client.channels.resolve(client.config.mainServer.channels.errors) as Discord.TextChannel).send({embeds: [new client.embed().setColor('#420420').setTitle('Error caught!').setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
});
process.on('uncaughtException', async(error: Error)=>{
    console.log(error);
    //(client.channels.resolve(client.config.mainServer.channels.errors) as Discord.TextChannel).send({embeds: [new client.embed().setColor('#420420').setTitle('Error caught!').setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
});
process.on('error', async(error: Error)=>{
    console.log(error);
    //(client.channels.resolve(client.config.mainServer.channels.errors) as Discord.TextChannel).send({embeds: [new client.embed().setColor('#420420').setTitle('Error caught!').setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
});

// Daggerwin MP loop
setInterval(async()=>{
    if (!client.config.botSwitches.mpstats) return;
    const msg = await (client.channels.resolve('904192878140608563') as Discord.TextChannel).messages.fetch('1042835699906400346')
    const embed = new client.embed();
    let Players = [];
    let Server: any;
    let CSG;
    let xmlData = undefined;

    // Connect to DB to retrieve the Gameserver info to fetch data.
    MPDB.sync();
    const newServerId = client.config.mainServer.id
    const ServerURL = MPDB.findOne({where: {serverId: newServerId}})
    const DBURL = (await ServerURL).ip
    const DBCode = (await ServerURL).code // vv todo: strip 'http://' from ServerURL
    const completedURL_DSS = DBURL + '/feed/dedicated-server-stats.json?code=' + DBCode
	const completedURL_CSG = DBURL + '/feed/dedicated-server-savegame.html?code=' + DBCode + '&file=careerSavegame'
    console.log(DBURL + '\n' + DBCode)
    try {
        Server = await client.axios.get(completedURL_DSS, {timeout: 4000})
    } catch (err){
        if (client.config.botSwitches.mpstatsDebug) {
            console.log(err)
        } else {
            console.log(`[${client.moment().format('DD/MM/YY HH:mm:ss')}] dag mp dss fail`)
        }
        embed.setTitle('Host is not responding.').setColor(client.config.embedColorRed)
        msg.edit({content: null, embeds: [embed]})
        return;
    }
    try {
        CSG = await client.axios.get(completedURL_CSG, {timeout: 4100}).then((xml: any)=>{
            xmlData = client.xjs.xml2js(xml.data, {compact: true, spaces: 2}).careerSavegame;
        })
    } catch (err){
        if (client.config.botSwitches.mpstatsDebug) {
            console.log(err)
        } else {
            console.log(`[${client.moment().format('DD/MM/YY HH:mm:ss')}] dag mp csg fail`)
        }
    }
    if (xmlData == undefined){
        if (client.config.botSwitches.mpstatsDebug) {
            console.log(xmlData)
        } else {
            console.log(`[${client.moment().format('DD/MM/YY HH:mm:ss')}] dag mp csg failed to convert`)
        }
        embed.setFooter({text: 'XML Data retrieve failed. Retrying in next minute.'})
        msg.edit({embeds: [embed]})
    }

    const DB = require(`./database/MPPlayerData.json`);
    DB.push(Server.data.slots.used)
    fs.writeFileSync(__dirname + `/database/MPPlayerData.json`, JSON.stringify(DB))
    
    // Number format function
    function formatNumber(number: any, digits: any, icon: any){
        var n = Number(number)
        return n.toLocaleString(undefined, {minimumFractionDigits: digits})+icon
    }
    var timeScale = Number(xmlData?.settings?.timeScale._text)

    if (Server.data.server.name.length == 0){
        embed.setTitle('The server seems to be offline.').setColor(client.config.embedColorRed);
        msg.edit({content: 'This embed will resume when server is back online.', embeds: [embed]})
    } else {
        const embed1 = new client.embed().setColor(client.config.embedColor).setTitle('Server details').addFields(
            {name: 'Current Map', value: `${Server.data.server.mapName.length == 0 ? '\u200b' : Server.data.server.mapName}`, inline: true},
			{name: 'Version', value: `${Server.data.server.version.length == 0 ? '\u200b' : Server.data.server.version}`, inline: true},
			{name: 'In-game Time', value: `${('0' + Math.floor((Server.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((Server.data.server.dayTime/60/1000)%60)).slice(-2)}`, inline: true},
			{name: 'Slot Usage', value: `${Number(xmlData?.slotSystem?._attributes?.slotUsage).toLocaleString('en-US')}`, inline: true},
			{name: 'Timescale', value: `${formatNumber(timeScale, 0, 'x')}`, inline: true}
        );
        await Server.data.slots.players.filter((x)=>x.isUsed !== false).forEach(player=>{
            Players.push(`**${player.name} ${player.isAdmin ? '| admin' : ''}**\nFarming for ${(Math.floor(player.uptime/60))} hr & ${('0' + (player.uptime % 60)).slice(-2)} min`)
        })
        embed.setDescription(`${Server.data.slots.used == 0 ? '*No players online*' : Players.join('\n\n')}`).setTitle(Server.data.server.name).setColor(client.config.embedColor)
        embed.setAuthor({name: `${Server.data.slots.used}/${Server.data.slots.capacity}`});
        msg.edit({content: 'This embed updates every minute.', embeds: [embed1, embed]})
    }
}, 60000)

// YouTube Upload notification
setInterval(async()=>{
	client.YTLoop('UCQ8k8yTDLITldfWYKDs3xFg', 'Daggerwin', '904192878140608563'); // 528967918772551702 = #videos-and-streams
	client.YTLoop('UCguI73--UraJpso4NizXNzA', 'Machinery Restorer', '767444045520961567') // 767444045520961567 = #machinery-restorer
}, 300000)

// Event loop for punishments and daily msgs
setInterval(async()=>{
    const now = Date.now()
    const lrsStart = client.config.LRSstart;
    
    client.punishments._content.filter((x:Punishment)=>x.endTime<= now && !x.expired).forEach(async (punishment:Punishment)=>{
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
        const yesterday = dailyMsgs.find((x:Array<number>)=>x[0] === formattedDate - 1);
        if (total < yesterday){ // messages went down.
            total = yesterday
        }
        dailyMsgs.push([formattedDate, total]);
        fs.writeFileSync(__dirname + '/database/dailyMsgs.json', JSON.stringify(dailyMsgs))
        console.log(`\x1b[36m[${client.moment().format('DD/MM/YY HH:mm:ss')}] \x1b[33m`, `Pushed [${formattedDate}, ${total}] to dailyMsgs`)
    }
}, 5000)

// Punishments
Object.assign(client.punishments,{
    createId(){
        return Math.max(...client.punishments._content.map((x:Punishment)=>x.id), 0) + 1;
    },
    async addPunishment(type: string, member: any, options: punOpt, moderator: string){
        const now = Date.now();
        const { time, reason, interaction } = options;
        const ms = require('ms');
        let timeInMillis;
        if (type !== 'mute'){
            timeInMillis = time ? ms(time) : null;
        } else {
            timeInMillis = time ? ms(time) : 2419200000;
        }
        switch (type) {
            case 'ban':
                const banData: Punishment = {type, id: this.createId(), member: member.id, moderator, time: now};
                let dm1:any;
                try {
                    dm1 = await member.send(`You've been banned from ${interaction.guild.name} ${timeInMillis ? `for ${client.formatTime(timeInMillis, 4, {longNames: true, commas: true})}` : 'forever'} for reason \`${reason || 'Reason unspecified'}\` (Case #${banData.id})`)
                } catch (err) {
                    setTimeout(()=>interaction.channel.send('Failed to DM user.'), 500)
                }
                const banResult = await interaction.guild.bans.create(member.id, {reason: `${reason || 'Reason unspecified'} | Case #${banData.id}`}).catch((err: Error)=>err.message);
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
                        {name: 'Reason', value: `\`${reason || 'Reason unspecified'}\``},
                        {name: 'Duration', value: `${timeInMillis ? `for ${client.formatTime(timeInMillis, 4, {longNames: true, commas: true})}` : 'forever'}`}
                    )
                }
            case 'softban':
                const guild = member.guild;
                const softbanData: Punishment = {type, id: this.createId(), member: member.user.id, moderator, time: now};
                const dm2 = await member.send(`You've been softbanned from ${member.guild.name} for reason \`${reason || 'Reason unspecified'}\` (Case #${softbanData.id})`).catch(err=>setTimeout(()=>interaction.channel.send(`Failed to DM <@${member.user.id}>.`), 500));
                const softbanResult = await member.ban({deleteMessageDays: 7, reason: `${reason || 'Reason unspecified'} | Case #${softbanData.id}`}).catch((err: Error)=>err.message);
                if (typeof softbanResult === 'string'){
                    dm2.delete();
                    return `Softban was unsuccessful: ${softbanResult}`;
                } else {
                    const unbanResult = guild.members.unban(softbanData.member, `${reason || 'Reason unspecified'} | Case #${softbanData.id}`).catch((err: Error)=>err.message);
                    if (typeof unbanResult === 'string'){
                        return `Softban (unban) was unsuccessful: ${softbanResult}`
                    } else {
                        if (reason) softbanData.reason = reason;
                        client.makeModlogEntry(softbanData, client);
                        this.addData(softbanData)
                        this.forceSave();
                        return new client.embed().setColor(client.config.embedColor).setTitle(`Case #${softbanData.id}: Softban`).setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`).addFields(
                            {name: 'Reason', value: `\`${reason || 'Reason unspecified'}\``}
                        )
                    }
                }
            case 'kick':
                const kickData: Punishment = {type, id: this.createId(), member: member.user.id, moderator, time: now};
                const dm3 = await member.send(`You've been kicked from ${member.guild.name} for reason \`${reason || 'Reason unspecified'}\` (Case #${kickData.id})`).catch((err:Error)=>setTimeout(()=>interaction.channel.send(`Failed to DM <@${member.user.id}>.`), 500));
                const kickResult = await member.kick(`${reason || 'Reason unspecified'} | Case #${kickData.id}`).catch((err:Error)=>err.message);
                if (typeof kickResult === 'string'){
                    dm3.delete();
                    return `Kick was unsuccessful: ${kickResult}`;
                } else {
                    if (reason) kickData.reason = reason;
                    client.makeModlogEntry(kickData, client);
                    this.addData(kickData);
                    this.forceSave();
                    return new client.embed().setColor(client.config.embedColor).setTitle(`Case #${kickData.id}: Kick`).setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`).addFields(
                        {name: 'Reason', value: `\`${reason || 'Reason unspecified'}\``}
                    )
                }
            case 'mute':
                const muteData: Punishment = {type, id: this.createId(), member: member.user.id, moderator, time: now};
                let muteResult;
                const dm4 = await member.send(`You've been muted in ${member.guild.name} ${timeInMillis ? `for ${client.formatTime(timeInMillis, 4, {longNames: true, commas: true})}` : 'forever'} for reason \`${reason || 'Reason unspecified'}\` (Case #${muteData.id})`).catch((err:Error)=>setTimeout(()=>interaction.channel.send('Failed to DM user.'), 500));
                if (timeInMillis){
                    muteResult = await member.timeout(timeInMillis, `${reason || 'Reason unspecified'} | Case #${muteData.id}`).catch((err: Error)=>err.message);
                } else {
                    muteResult = await member.timeout(2419200000, `${reason || 'Reason unspecified'} | Case #${muteData.id}`).catch((err: Error)=>err.message);
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
                    const embedm = new client.embed().setColor(client.config.embedColor).setTitle(`Case #${muteData.id}: Mute`).setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`).addFields(
                        {name: 'Reason', value: `\`${reason || 'Reason unspecified'}\``},
                        {name: 'Duration', value: `${client.formatTime(timeInMillis, 4, {longNames: true, commas: true})}`}
                    )
                    if (moderator !== '795443537356521502') {return embedm};
                }
            case 'warn':
                const warnData: Punishment = {type, id: this.createId(), member: member.user.id, moderator, time: now};
                const warnResult = await member.send(`You've been warned in ${member.guild.name} for reason \`${reason || 'Reason unspecified'}\` (Case #${warnData.id})`).catch((err:Error)=>setTimeout(()=>interaction.channel.send(`Failed to DM <@${member.user.id}>.`), 500));
                if (typeof warnResult === 'string'){
                    return `Warn was unsuccessful: ${warnResult}`;
                } else {
                    if (reason) warnData.reason = reason;
                    client.makeModlogEntry(warnData, client);
                    this.addData(warnData);
                    this.forceSave();
                    const embedw = new client.embed().setColor(client.config.embedColor).setTitle(`Case #${warnData.id}: Warn`).setDescription(`${member.user.tag}\n<@${member.user.id}>\n(\`${member.user.id}\`)`).addFields(
                        {name: 'Reason', value: `\`${reason || 'Reason unspecified'}\``}
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
                removePunishmentResult = await guild.members.unban(punishment.member, `${reason || 'Reason unspecified'} | Case #${id}`).catch((err: TypeError)=>err.message);
            }else if (punishment.type === 'mute') {
                //remove role
                const member = await guild.members.fetch(punishment.member).catch(err=>undefined);
                if (member){
                    removePunishmentResult = await member
                    if (typeof removePunishmentResult !== 'string'){
                        member.timeout(null, `${reason || 'Reason unspecified'} | Case #${id}`)
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
                return `Successfully ${punishment.type === 'ban' ? 'unbanned' : 'unmuted'} **${removePunishmentResult?.tag}** (\`${removePunishmentResult?.id}\`) for reason \`${reason || 'Reason unspecified'}\``;
            }
        } else {
            try {
                const removePunishmentData = {type: 'removeOtherPunishment', id, cancels: punishment.id, member: punishment.member, reason, moderator, time: now};
                client.makeModlogEntry(removePunishmentData, client);
                this._content[this._content.findIndex(x=>x.id === punishment.id)].expired = true;
                this.addData(removePunishmentData).forceSave();
                return `Successfully removed Case #${punishment.id} (type: ${punishment.type}, user: ${punishment.member}).`;
            } catch(error: any){
                return `${punishment.type[0].toUpperCase()+punishment.type.slice(1)} removal was unsuccessful: ${error.message}`
            }
        }
    }
})