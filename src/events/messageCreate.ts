import Discord, { ChannelType } from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'messageCreate',
    execute: async(client:TClient, message:Discord.Message)=>{
            if (message.author.bot) return;
            if (message.channel.type === ChannelType.DM) return;
            const msgarr = message.content.toLowerCase().split(' ');
            let automodded: boolean;

            function onTimeout(){
                delete client.repeatedMessages[message.author.id]
            }

            const Whitelist = [
                // Arrary of channel ids for automod to be disabled in
            ]

            if (client.bannedWords._content.some((x)=>msgarr.includes(x)) && !message.member.roles.cache.has(client.config.mainServer.roles.dcmod) && message.guildId == client.config.mainServer.id && !Whitelist.includes(message.channelId) && client.config.botSwitches.automod){
                automodded = true;
                message.delete().catch((err)=>{
                    console.log('bannedWords automod; msg got possibly deleted by another bot.')
                })
                message.channel.send('That word is banned here.').then((x)=>setTimeout(()=>x.delete(), 5000));
                if (client.repeatedMessages[message.author.id]){
                    // add this message to the list
                    client.repeatedMessages[message.author.id].set(message.createdTimestamp, {cont: 0, ch: message.channelId});

                    // reset timeout
                    clearTimeout(client.repeatedMessages[message.author.id].to);
                    client.repeatedMessages[message.author.id].to = setTimeout(onTimeout, 30000);

                    // this is the time in which 4 messages have to be sent, in milliseconds (ms)
                    const threshold = 30000;

                    // message mustve been sent after (now - threshold), so purge those that were sent earlier
                    client.repeatedMessages[message.author.id] = client.repeatedMessages[message.author.id].filter((x, i)=>i >= Date.now() - threshold)

                    // a spammed message is one that has been sent atleast 4 times in the last threshold milliseconds
                    const spammedMessage = client.repeatedMessages[message.author.id]?.find((x)=>{
                        return client.repeatedMessages[message.author.id].size >= 4;
                    });

                    // if a spammed message exists;
                    if (spammedMessage){
                        // mute
                        const muteResult = await client.punishments.addPunishment('mute', { time: '30m' }, (client.user as Discord.User).id, 'Automod; Banned words', message.author, message.member as Discord.GuildMember);
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
                message.delete().catch((err)=>{
                    console.log('advertisement automod; msg got possibly deleted by another bot.')
                })
            }

            if (message.guildId == client.config.mainServer.id && !automodded){
                client.userLevels.incrementUser(message.author.id); // Ranking incrementation
            }
            // Mop gifs from banned channels without Monster having to mop them.
            const bannedChannels = [
                '516344221452599306', // #mp-moderators
                '742324777934520350', // #discord-moderators
            ]
            const gifURL = [
                'tenor.com/view',
                'giphy.com/gifs',
                'giphy.com/media'
            ]
            if (gifURL.some(e=>message.content.toLowerCase().includes(e)) && bannedChannels.includes(message.channelId)) {
                message.reply('Gifs are not allowed in this channel.').then((msg: any)=>message.delete())
            }

            // Autoresponse:tm:
        if (client.config.botSwitches.autores && !automodded) {
            const MorningArray = ['good morning all', 'good morning everyone', 'morning all', 'morning everyone', 'morning lads', 'morning guys']
            const AfternoonArray = ['good afternoon', 'afternoon all']
            const EveningArray = ['good evening', 'evening all', 'evening everyone']
            const NightArray = ['night all', 'night everyone']
            const PasswordArray = ['whats the password', 'what\'s the password', 'password pls']
            const cantRead = ['i cant read', 'i can\'t read', 'cant read', 'can\'t read']
            const NawdicBrokeIt = ['break', 'broke', 'broken']
            const deadChat = ['dead chat', 'chat is dead', 'dead server']

            if (message.mentions.members.has('309373272594579456') && !client.isStaff(message.member)){
                message.reply('Please don\'t tag Daggerwin, read rule 14 in <#468846117405196289>')
            }
            if (message.mentions.members.has('215497515934416896') && !client.isStaff(message.member) && message.type != 19){
                message.reply('Please don\'t tag Monster unless it\'s important!')
            }
            if (message.content.toLowerCase().startsWith(`*mp players`) || message.content.toLowerCase().startsWith(`*mp status`)){
                message.reply('Prefix-based MP commands has moved to </mp players:1044732701317537873> and </mp status:1044732701317537873>')
            }
            if (message.content.toLowerCase().startsWith(`*lrs`) || message.content.toLowerCase().startsWith(`*rank`)){
                message.reply('Prefix-based LRS command has moved to </rank view:1044732701317537877>')
            }
            if (message.content.toLowerCase().startsWith(`*mp series`) || message.content.toLowerCase().startsWith(`*mp info`)){
                message.reply('Prefix-based MP info commands has moved to </mp series:1044732701317537873> and </mp info:1044732701317537873>')
            }
            if (PasswordArray.some(e=>message.content.toLowerCase().includes(e))){
                message.reply('Password and other details can be found in <#543494084363288637>')
            }
            if (cantRead.some(e=>message.content.toLowerCase().includes(e))){
                message.reply('https://tenor.com/view/aristocats-george-pen-cap-meticulous-gif-5330931')
            }
            if (message.content.toLowerCase().includes('is daggerbot working')){
                message.reply('https://tenor.com/view/i-still-feel-alive-living-existing-active-singing-gif-14630579')
            }
            if (deadChat.some(e=>message.content.toLowerCase().includes(e))){
                message.reply('https://cdn.discordapp.com/attachments/925589318276382720/1011333656167579849/F57G5ZS.png')
            }
            if (message.content.toLowerCase().includes('nawdic') && (NawdicBrokeIt.some(e=>message.content.toLowerCase().includes(e)))){
                const embed = new client.embed().setTitle('*Nawdic has done an oopsie*').setImage('https://c.tenor.com/JSj9ie_MD9kAAAAC/kopfsch%C3%BCtteln-an-kopf-fassen-oh-no.gif').setColor(client.config.embedColor)
                message.reply({embeds: [embed]})
            }
            if (MorningArray.some(e=>message.content.toLowerCase().startsWith(e))){
                message.reply(`Good morning **${message.member.displayName}**!`)
            }
            if (AfternoonArray.some(e=>message.content.toLowerCase().startsWith(e))){
                message.reply(`Afternoon **${message.member.displayName}**!`)
            }
            if (EveningArray.some(e=>message.content.toLowerCase().startsWith(e))){
                message.reply(`Good evening **${message.member.displayName}**!`)
            }
            if (NightArray.some(e=>message.content.toLowerCase().startsWith(e))){
                message.reply(`Night **${message.member.displayName}**`)
            }
        }
    }
}
