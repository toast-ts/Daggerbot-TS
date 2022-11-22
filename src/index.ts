import Discord from 'discord.js';
import { TClient } from './client';
const client = new TClient;
client.init();
import fs from 'node:fs';
import MPDB from './models/MPServer';
import {Punishment, UserLevels} from './typings/interfaces';

client.on('ready', async()=>{
    client.guilds.cache.forEach(async(e: { members: { fetch: () => any; }; })=>{await e.members.fetch()});
    setInterval(async()=>{
        client.user.setPresence({activities: [{ name: 'Slash commands!', type: 1, url: 'https://www.youtube.com/watch?v=eO9YZsJmjlM' }], status: 'online'});
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
    (client.channels.resolve(client.config.mainServer.channels.bot_status) as Discord.TextChannel).send(`${client.user.username} is active\n\`\`\`json\n${Object.entries(client.config.botSwitches).map((hi)=>`${hi[0]}: ${hi[1]}`).join('\n')}\`\`\``);

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
    (client.channels.resolve(client.config.mainServer.channels.errors) as Discord.TextChannel).send({embeds: [new client.embed().setColor('#420420').setTitle('Error caught!').setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
});
process.on('error', async(error: Error)=>{
    console.log(error);
    (client.channels.resolve(client.config.mainServer.channels.errors) as Discord.TextChannel).send({embeds: [new client.embed().setColor('#420420').setTitle('Error caught!').setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
});

// Daggerwin MP loop
setInterval(async()=>{
    if (!client.config.botSwitches.mpstats) return;
    const msg = await (client.channels.resolve('543494084363288637') as Discord.TextChannel).messages.fetch('1023699243183112192')
    const embed = new client.embed();
    let Players = [];
    let Server: any;
    let CSG: any;
    let xmlData = undefined;

    // Connect to DB to retrieve the Gameserver info to fetch data.
    MPDB.sync();
    const newServerId = client.config.mainServer.id
    const ServerURL = MPDB.findOne({where: {serverId: newServerId}})
    const DBURL = (await ServerURL).ip
    const DBCode = (await ServerURL).code
    const verifyURL = DBURL.match(/http/);
    const completedURL_DSS = DBURL + '/feed/dedicated-server-stats.json?code=' + DBCode
	const completedURL_CSG = DBURL + '/feed/dedicated-server-savegame.html?code=' + DBCode + '&file=careerSavegame'
    if (!verifyURL) return msg.edit({content: 'Invalid gameserver IP, please update!', embeds: null})
    try {
        Server = await client.axios.get(completedURL_DSS, {timeout: 4000})
    } catch (err){
        if (client.config.botSwitches.mpstatsDebug) {
            console.log(err)
        } else {
            console.log(`[${client.moment().format('DD/MM/YY HH:mm:ss')}] dag mp dss fail, maybe host isn't responding?`)
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
    console.log(`[${client.moment().format('DD/MM/YY HH:mm:ss')}] YTLoop interval`)
}, 300000)

// Event loop for punishments and daily msgs
setInterval(async()=>{
    const now = Date.now();
    const lrsStart = client.config.LRSstart;
    
    client.punishments._content.filter((x:Punishment)=>x.endTime<= now && !x.expired).forEach(async (punishment:Punishment)=>{
        console.log(`\x1b[36m[${client.moment().format('DD/MM/YY HH:mm:ss')}]`, '\x1b[32m' + `${punishment.member}\'s ${punishment.type} should expire now`);
        const unpunishResult = await client.punishments.removePunishment(punishment.id, client.user.id, 'Time\'s up!');
        console.log(`\x1b[36m[${client.moment().format('DD/MM/YY HH:mm:ss')}]`, '\x1b[32m' + unpunishResult);
    });
    
    const formattedDate = Math.floor((now - lrsStart)/1000/60/60/24);
    const dailyMsgs = require('./database/dailyMsgs.json');
    if (!dailyMsgs.some((x:Array<number>)=>x[0] === formattedDate)){
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
