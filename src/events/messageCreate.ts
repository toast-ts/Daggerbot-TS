import Discord, { ChannelType } from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'messageCreate',
    execute: async(client:TClient, message:Discord.Message)=>{
        if (!client.config.botSwitches.commands && !client.config.eval.whitelist.includes(message.author.id)) return
            if (message.author.bot) return;
            if (message.channel.type === ChannelType.DM) return;
            const msgarr = message.content.toLowerCase().split(' ');
            let automodded: any;

            function onTimeout(){
                delete client.repeatedMessages[message.author.id]
            }

            const Whitelist = [
                // Arrary of channel ids for automod to be disabled in
            ]

            if (client.bannedWords._content.some((x: any)=>msgarr.includes(x)) && !message.member.roles.cache.has(client.config.mainServer.roles.dcmod) && message.guildId == client.config.mainServer.id && !Whitelist.includes(message.channelId) && client.config.botSwitches.automod){
                automodded = true;
                message.delete();
                message.channel.send('That word is banned here.').then((x: any)=>setTimeout(()=>x.delete(), 5000));
                if (client.repeatedMessages[message.author.id]){
                    // add this message to the list
                    client.repeatedMessages[message.author.id].set(message.createdTimestamp, {cont: 0, ch: message.channelId});

                    // reset timeout
                    clearTimeout(client.repeatedMessages[message.author.id].to);
                    client.repeatedMessages[message.author.id].to = setTimeout(onTimeout, 30000);

                    // this is the time in which 4 messages have to be sent, in milliseconds (ms)
                    const threshold = 30000;

                    // message mustve been sent after (now - threshold), so purge those that were sent earlier
                    client.repeatedMessages[message.author.id] = client.repeatedMessages[message.author.id].filter((x: any, i: any)=>i >= Date.now() - threshold)

                    // a spammed message is one that has been sent atleast 4 times in the last threshold milliseconds
                    const spammedMessage = client.repeatedMessages[message.author.id]?.find((x:any)=>{
                        return client.repeatedMessages[message.author.id].size >= 4;
                    });

                    // if a spammed message exists;
                    if (spammedMessage){
                        // mute
                        const muteResult = await client.punishments.addPunishment('mute', message.member, {reason: 'Automod; banned words', time: '30m'}, client.user.id);
                        // and clear their list of long messages
                        delete client.repeatedMessages[message.author.id];
                    }
                } else {
                    client.repeatedMessages[message.author.id] = new client.collection();
                    client.repeatedMessages[message.author.id].set(message.createdTimestamp, {cont: 0, ch: message.channelId});
                    // autodelete after 30 secs
                    client.repeatedMessages[message.author.id].to = setTimeout(onTimeout, 30000);
                }
            }
            if (message.content.toLowerCase().includes('discord.gg/') && !message.member.roles.cache.has(client.config.mainServer.roles.dcmod)) {
                automodded = true;
                message.delete();
            }

            if (message.guildId == client.config.mainServer.id && !automodded){
                client.userLevels.incrementUser(message.author.id); // Ranking incrementation
            }
            // Mop gifs from banned channels without Monster having to mop them.
            const bannedChannels = [
                '516344221452599306', // #mp-moderators
                '742324777934520350', // #discord-moderators
                '904192878140608563'
            ]
            if (message.content.toLowerCase().includes('tenor.com/view') || message.content.toLowerCase().includes('giphy.com/gifs/') || message.content.toLowerCase().includes('giphy.com/media/') && bannedChannels.includes(message.channelId)) {
                message.reply('Gifs are not allowed in this channel.').then((msg: any)=>message.delete())
            }

            // Autoresponse:tm:
        if (!client.config.botSwitches.autores && !automodded) {
            if (message.mentions.members.has('309373272594579456') && !client.isStaff(message.member) && message.type != 19){
                message.reply('Please don\'t tag Daggerwin, read rule 14 in <#468846117405196289>')
            }
            if (message.mentions.members.has('215497515934416896') && !client.isStaff(message.member) && message.type != 19){
                message.reply('Please don\'t tag Monster unless it\'s important!')
            }
            if (message.content.toLowerCase().startsWith(`${client.config.prefix}players`) || message.content.toLowerCase().startsWith(`${client.config.prefix}status`)){
                message.reply('Commands for the MP server have been moved to `*mp players` and `*mp status`.')
            }
            if (message.content.toLowerCase().includes('whats the password') || message.content.toLowerCase().includes('what\'s the password') || message.content.toLowerCase().includes('password pls')){
                message.reply('Password and other details can be found in <#543494084363288637>')
            }
            if (message.content.toLowerCase().includes('i cant read') || message.content.toLowerCase().includes('i can\'t read')){
                message.reply('https://tenor.com/view/aristocats-george-pen-cap-meticulous-gif-5330931')
            }
            if (message.content.toLowerCase().includes('is daggerbot working')){
                message.reply('https://tenor.com/view/i-still-feel-alive-living-existing-active-singing-gif-14630579')
            }
            if (message.content.toLowerCase().includes('dead chat') || message.content.toLowerCase().includes('chat is dead')){
                message.reply('https://cdn.discordapp.com/attachments/925589318276382720/1011333656167579849/F57G5ZS.png')
            }
            if (message.content.toLowerCase().includes('nawdic') && (message.content.toLowerCase().includes('break') || message.content.toLowerCase().includes('broke') || message.content.toLowerCase().includes('broken'))){
                const embed = new client.embed().setTitle('*Nawdic has done an oopsie*').setImage('https://c.tenor.com/JSj9ie_MD9kAAAAC/kopfsch%C3%BCtteln-an-kopf-fassen-oh-no.gif').setColor(client.config.embedColor)
                message.reply({embeds: [embed]})
            }
            if (message.content.toLowerCase().startsWith('good morning') || message.content.toLowerCase().startsWith('morning all') || message.content.toLowerCase().startsWith('morning everyone')){
                message.reply(`Good morning **${message.member.displayName}**!`)
            }
            if (message.content.toLowerCase().startsWith('good afternoon') || message.content.toLowerCase().startsWith('afternoon all')){
                message.reply(`Afternoon **${message.member.displayName}**!`)
            }
            if (message.content.toLowerCase().startsWith('good evening') || message.content.toLowerCase().startsWith('evening all')){
                message.reply(`Good evening **${message.member.displayName}**!`)
            }
            if (message.content.toLowerCase().startsWith('night all') || message.content.toLowerCase().startsWith('night everyone')){
                message.reply(`Night **${message.member.displayName}**`)
            }
        }
    }
}