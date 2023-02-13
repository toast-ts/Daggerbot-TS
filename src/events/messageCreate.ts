import Discord, { ChannelType } from 'discord.js';
import TClient from '../client';
export default {
    async run(client:TClient, message:Discord.Message){
            if (message.author.bot || message.channel.type === ChannelType.DM) return;
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
                message.delete().catch(err=>console.log('bannedWords automod; msg got possibly deleted by another bot.'))
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
            if (message.content.toLowerCase().includes('discord.gg/') && !message.member.roles.cache.has(client.config.mainServer.roles.dcmod) && message.guildId == client.config.mainServer.id && !Whitelist.includes(message.channelId)) {
                automodded = true;
                message.delete().catch(err=>console.log('advertisement automod; msg got possibly deleted by another bot.'))
                message.channel.send('Advertising other Discord servers is not allowed.').then(x=>setTimeout(()=>x.delete(), 10000))
                if (client.repeatedMessages[message.author.id]){
                    client.repeatedMessages[message.author.id].set(message.createdTimestamp,{cont:1,ch:message.channelId});

                    clearTimeout(client.repeatedMessages[message.author.id].to);
                    client.repeatedMessages[message.author.id].to = setTimeout(onTimeout, 60000);
                    const threshold = 60000;
                    client.repeatedMessages[message.author.id] = client.repeatedMessages[message.author.id].filter((x:any, i:number)=> i >= Date.now() - threshold)
                    const spammedMessage = client.repeatedMessages[message.author.id]?.find((x:any)=>{
                        return client.repeatedMessages[message.author.id].filter((y:any)=>x.cont === y.cont).size >= 4;
                    });

                    if (spammedMessage){
                        const muteResult = await client.punishments.addPunishment('mute', {time: '1h'}, (client.user as Discord.User).id, 'Automod; Discord advertisement', message.author, message.member as Discord.GuildMember);
                        delete client.repeatedMessages[message.author.id];
                    }
                }else{
                    client.repeatedMessages[message.author.id] = new client.collection();
                    client.repeatedMessages[message.author.id].set(message.createdTimestamp, {cont: 1, ch: message.channelId});
                    client.repeatedMessages[message.author.id].to = setTimeout(onTimeout, 60000);
                }
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
            const MorningArray = ['good morning all', 'good morning everyone', 'morning all', 'morning everyone', 'morning lads', 'morning guys', 'good morning everybody']
            const AfternoonArray = ['good afternoon', 'afternoon all']
            const EveningArray = ['good evening', 'evening all', 'evening everyone']
            const NightArray = ['night all', 'night everyone']
            const PasswordArray = ['whats the password', 'what\'s the password', 'password pls']
            const cantRead = ['i cant read', 'i can\'t read', 'cant read', 'can\'t read']
            const NawdicBrokeIt = ['break', 'broke', 'broken']
            const deadChat = ['dead chat', 'chat is dead', 'dead server']

            const PersonnyMcPerson = `**${message.member.displayName}**`;
            const MorningPhrases = [
                `Morning ${PersonnyMcPerson}, did you sleep great?`, `Good morning ${PersonnyMcPerson}!`, `Hope you enjoyed your breakfast, ${PersonnyMcPerson}!`,
                `Gm ${PersonnyMcPerson}`, `Uh.. What time is it? Oh yea, morning ${PersonnyMcPerson}`, `Morning and hope you had a good dream last night, ${PersonnyMcPerson}`
            ]
            const AfternoonPhrases = [
                `Afternoon ${PersonnyMcPerson}!`, `What a nice day outside, ${PersonnyMcPerson}`, `Good afternoon ${PersonnyMcPerson}`,
                `Hope you had a good day so far.`, `Did you enjoy your day yet, ${PersonnyMcPerson}?`, `Weather doesn't look too bad outside right?`,
                `How's the trip outside, ${PersonnyMcPerson}?`
            ]
            const EveningPhrases = [
                `I can't believe the time flies so quickly!`, `Evening ${PersonnyMcPerson}!`, `Hope you enjoyed the dinner, ${PersonnyMcPerson}!`,
                `Good evening ${PersonnyMcPerson}!`, `You look tired, ready to go to sleep yet?`, `Being outside was an exhausting task isn't it?`
            ]
            const NightPhrases = [
                `Good night ${PersonnyMcPerson}!`, `Night ${PersonnyMcPerson}!`, `Sweet dreams, ${PersonnyMcPerson}.`, `Don't fall out of sky in your dreamworld, ${PersonnyMcPerson}!`,
                `Nighty night!`, `I hope tomorrow is a good day for you, ${PersonnyMcPerson}!`
            ]

            if (message.mentions.members.has('309373272594579456') && !client.isStaff(message.member)){
                message.reply('Please don\'t tag Daggerwin, read rule 14 in <#468846117405196289>')
            }
            if (message.mentions.members.has('215497515934416896') && !client.isStaff(message.member) && message.type != 19){
                message.reply('Please don\'t tag Monster unless it\'s important!')
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
            if (message.content.toLowerCase().includes('nawdic') && NawdicBrokeIt.some(e=>message.content.toLowerCase().includes(e)) && message.channelId !== '516344221452599306'){
                message.reply({embeds: [new client.embed().setTitle('*Nawdic has done an oopsie*').setImage('https://c.tenor.com/JSj9ie_MD9kAAAAC/kopfsch%C3%BCtteln-an-kopf-fassen-oh-no.gif').setColor(client.config.embedColor)]})
            }
            if (MorningArray.some(e=>message.content.toLowerCase().startsWith(e)) && message.channelId == '468835415093411863'){
                message.reply(`${MorningPhrases[Math.floor(Math.random()*MorningPhrases.length)]}`)
            }
            if (AfternoonArray.some(e=>message.content.toLowerCase().startsWith(e)) && message.channelId == '468835415093411863'){
                message.reply(`${AfternoonPhrases[Math.floor(Math.random()*AfternoonPhrases.length)]}`)
            }
            if (EveningArray.some(e=>message.content.toLowerCase().startsWith(e)) && message.channelId == '468835415093411863'){
                message.reply(`${EveningPhrases[Math.floor(Math.random()*EveningPhrases.length)]}`)
            }
            if (NightArray.some(e=>message.content.toLowerCase().startsWith(e)) && message.channelId == '468835415093411863'){
                message.reply(`${NightPhrases[Math.floor(Math.random()*NightPhrases.length)]}`)
            }
            // Failsafe thingy (Toastproof maybe)
            if (message.content.startsWith('!!_wepanikfrfr') && client.config.eval.whitelist.includes(message.author.id)){
                (client.guilds.cache.get(message.guildId) as Discord.Guild).commands.set(client.registry).then(()=>message.reply('How did you manage to lose the commands??? Anyways, it\'s re-registered now.')).catch((e:Error)=>message.reply(`Failed to deploy slash commands:\n\`\`\`${e.message}\`\`\``));
            }
        }
    }
}
