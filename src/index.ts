import Discord = require('discord.js');
const TClient = require('./client');
const client = new TClient;
client.init();
import fs = require('node:fs');
import ServerDB from './models/MPServer';
import axios from 'axios';
import xjs = require('xml-js');

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
process.on('unhandledRejection', async(error)=>{
    console.log(error)
    client.channels.resolve(client.config.mainServer.channels.errors).send({embeds: [new client.embed().setColor('#420420').setTitle('Error caught!').setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
});
process.on('uncaughtException', async(error)=>{
    console.log(error)
    client.channels.resolve(client.config.mainServer.channels.errors).send({embeds: [new client.embed().setColor('#420420').setTitle('Error caught!').setDescription(`**Error:** \`${error.message}\`\n\n**Stack:** \`${`${error.stack}`.slice(0, 2500)}\``)]})
});
process.on('error', async(error)=>{
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
    let CSG: any;
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
        Server = await axios.get(completedURL_DSS, {timeout: 4000})
    } catch (err){
        console.log(`[${client.moment().format('HH:mm:ss')}] dag mp dss fail`)
        embed.setTitle('Data could not be retrieved, the host may not be responding.').setColor(client.config.embedColorRed)
        msg.edit({embeds: [embed]})
        return;
    }
    try {
        CSG = await axios.get(completedURL_CSG, {timeout: 4100}).then((xml)=>{
            xmlData = xjs.xml2js(xml.data, {compact: true, spaces: 2}).careerSavegame;
        })
    } catch (err){
        console.log(`[${client.moment().format('HH:mm:ss')}] dag mp csg fail`)
    }
    if (xmlData == undefined){
        console.log(`[${client.moment().format('HH:mm:ss')}] dag mp csg failed to convert`)
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
    const now = Date.now()
    const lrsStart = client.config.LRSstart;
    client.punishments._content.filter(x=>x.endTime<=now && !x.expired).forEach(async punishment=>{
        console.log(`${punishment.member}'s ${punishment.type} should expire now`);
        const unpunishResult = await client.punishments.removePunishment(punishment.id, client.user.id, 'Time\'s up!')
        console.log(unpunishResult);
    });
    const formattedDate = Math.floor((now - lrsStart)/1000/60/60/24);
    const dailyMsgs = require('./database/dailyMsgs.json');
    if (!dailyMsgs.some(x=>x[0] === formattedDate)){
        let total = Object.values(client.userLevels._content).reduce((a,b)=>a + b.messages, 0); // sum of all users
        const yesterday = dailyMsgs.find(x=>x[0] === formattedDate - 1);
        if (total < yesterday){ // messages went down.
            total = yesterday
        }
        dailyMsgs.push([formattedDate, total]);
        fs.writeFileSync(__dirname + './database/dailyMsgs.json', JSON.stringify(dailyMsgs))
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