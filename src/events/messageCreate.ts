import Discord from 'discord.js';
import TClient from 'src/client';
export default {
  async run(client:TClient, message:Discord.Message){
    if (message.author.bot || message.channel.type === Discord.ChannelType.DM) return;
    const msgarr = message.content.toLowerCase().replaceAll(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\n]/g, ' ').split(' ');
    let automodded: boolean;

    const Whitelist = [] // Array of channel ids for automod to be disabled in (Disables bannedWords and advertisement, mind you.)

    async function repeatedMessages(thresholdTime:number, thresholdAmount:number, type:string, muteTime:string, muteReason:string){
      if (client.repeatedMessages[message.author.id]){
        // Add message to the list
        client.repeatedMessages[message.author.id].data.set(message.createdTimestamp, {type, channel: message.channelId});

        // Reset the timeout
        clearTimeout(client.repeatedMessages[message.author.id].timeout);
        client.repeatedMessages[message.author.id].timeout = setTimeout(()=>delete client.repeatedMessages[message.author.id], thresholdTime);

        // Message sent after (now - threshold), so purge those that were sent earlier
        client.repeatedMessages[message.author.id].data = client.repeatedMessages[message.author.id].data.filter((x,i)=>i>=Date.now() - thresholdTime);

        // A spammed message is one that has been sent within the threshold parameters
        const spammedMessage = client.repeatedMessages[message.author.id].data.find(x=>{
          return client.repeatedMessages[message.author.id].data.filter(y=>x.type===y.type).size >= thresholdAmount;
        });
        if (spammedMessage){
          delete client.repeatedMessages[message.author.id];
          await client.punishments.addPunishment('mute', {time: muteTime}, (client.user as Discord.User).id, `Automod; ${muteReason}`, message.author, message.member as Discord.GuildMember);
        }
      } else {
        client.repeatedMessages[message.author.id] = {data: new client.collection(), timeout: setTimeout(()=>delete client.repeatedMessages[message.author.id], thresholdTime)};
        client.repeatedMessages[message.author.id].data.set(message.createdTimestamp, {type, channel: message.channelId});
      }
    }

    if (client.config.botSwitches.automod && !message.member.roles.cache.has(client.config.mainServer.roles.dcmod) && message.guildId == client.config.mainServer.id){
      if (await client.bannedWords._content.findById(msgarr) && !Whitelist.includes(message.channelId)){
        automodded = true;
        message.delete().catch(()=>console.log('bannedWords automod; msg got possibly deleted by another bot.'));
        message.channel.send('That word isn\'t allowed here.').then(x=>setTimeout(()=>x.delete(), 10000));
        await repeatedMessages(30000, 3, 'bw', '30m', 'Constant swearing');
      } else if (message.content.toLowerCase().includes('discord.gg/') && !client.isStaff(message.member as Discord.GuildMember)){
        const url = msgarr.find(x=>x.includes('discord.gg/'));
        const validInvite = await client.fetchInvite(url).catch(()=>undefined);
        if (validInvite && validInvite.guild?.id !== client.config.mainServer.id){
          automodded = true;
          message.delete().catch(()=>console.log('Advertisement automod; msg got possibly deleted by another bot.'));
          message.channel.send('Please don\'t advertise other Discord servers.').then(x=>setTimeout(()=>x.delete(), 15000));
          await repeatedMessages(60000, 2, 'adv', '1h', 'Discord advertisement');
        }
      }
    }

    if (message.guildId == client.config.mainServer.id && !automodded) client.userLevels.incrementUser(message.author.id)
    // Mop gifs from banned channels without Monster having to mop them.
    const bannedChannels = [
      '516344221452599306', // #mp-moderators
      '742324777934520350', // #discord-moderators
    ]
    const gifURL = ['tenor.com/view', 'giphy.com/gifs', 'giphy.com/media']
    if (gifURL.some(e=>message.content.toLowerCase().includes(e)) && bannedChannels.includes(message.channelId)) message.reply('Gifs are not allowed in this channel.').then((msg)=>message.delete())

    // Autoresponse:tm:
    if (client.config.botSwitches.autores && !automodded) {
      const MorningArray = ['good morning all', 'good morning everyone', 'morning all', 'morning everyone', 'morning lads', 'morning guys', 'good morning everybody']
      const AfternoonArray = ['good afternoon', 'afternoon all', 'afternoon everyone']
      const EveningArray = ['good evening', 'evening all', 'evening everyone']
      const NightArray = ['night all', 'night everyone', 'night guys']
      const PasswordArray = ['whats the password', 'what\'s the password', 'password pls']
      const cantRead = ['i cant read', 'i can\'t read', 'cant read', 'can\'t read']
      const TheyBrokeIt = ['break', 'broke', 'broken']
      const deadChat = ['dead chat', 'chat is dead', 'dead server', 'inactive chat', 'inactive channel']

      const PersonnyMcPerson = `**${message.member.displayName}**`;
      const GeneralChatID = '468835415093411863';
      const MorningPhrases = [
        `Morning ${PersonnyMcPerson}, did you sleep great?`, `Good morning ${PersonnyMcPerson}!`, `Hope you enjoyed your breakfast, ${PersonnyMcPerson}!`,
        `Gm ${PersonnyMcPerson}.`, `Uh.. What time is it? Oh yea, morning ${PersonnyMcPerson}.`, `Morning and hope you had a good dream last night, ${PersonnyMcPerson}.`,
        'Time to get started with today\'s stuff!', `Don't forget to do your morning routine, ${PersonnyMcPerson}!`, 'Enjoy the breakfast and start your day.',
        'Nuh! No morning message for you!\n*Just kidding, good morning!*', `Rise and shine, ${PersonnyMcPerson}.`, 'Howdy! How\'s your morning?',
        `*opens blinds wide enough to blast sunrays into the room*\nWakey wakey, ${PersonnyMcPerson}. Time to get up!`, 'https://tenor.com/view/skyrim-intro-awake-finally-awake-gif-22633549',
        `Good grief, is it Monday already? Anyways, morning ${PersonnyMcPerson}..`, `This time I can shout! So here we go! 1..2..3\n*inhales*\nMORNING ${PersonnyMcPerson.toUpperCase()}!`,
        'Gooooood morning to you!', `Good morning to you! You know what else is good? A segue to our sponsor, breakfast!.\nGet started with getting out of the bed and have some breakfast!`
      ]
      const AfternoonPhrases = [
        `Afternoon ${PersonnyMcPerson}!`, `What a nice day outside, ${PersonnyMcPerson}`, `Good afternoon ${PersonnyMcPerson}`,
        'Hope you had a good day so far.', `Did you enjoy your day yet, ${PersonnyMcPerson}?`, 'Weather doesn\'t look too bad outside right?',
        `How's the trip outside, ${PersonnyMcPerson}?`, `~~Morning~~ Afternoon ${PersonnyMcPerson}!`, 'Afternoon already? Jeez, time go brrrr!',
        'We\'re halfway through the day, aren\'t we?'
      ]
      const EveningPhrases = [
        'I can\'t believe the time flies so quickly!', `Evening ${PersonnyMcPerson}!`, `Hope you enjoyed the dinner, ${PersonnyMcPerson}!`,
        `Good evening ${PersonnyMcPerson}!`, 'You look tired, ready to go to sleep yet?', 'Being outside was an exhausting task isn\'t it?',
        'Did you have a good day so far?', 'May I suggest sleep?', `You heard me! ${PersonnyMcPerson}, it's almost dinner time!`,
        `How's your day going, ${PersonnyMcPerson}?`, `${PersonnyMcPerson}, may I suggest... *sleep?*`, 'Today is almost over, you deserve some rest!'
      ]
      const NightPhrases = [
        `Good night ${PersonnyMcPerson}!`, `Night ${PersonnyMcPerson}!`, `Sweet dreams, ${PersonnyMcPerson}.`, `Don't fall out of sky in your dreamworld, ${PersonnyMcPerson}!`,
        'Nighty night!', `I hope tomorrow is a good day for you, ${PersonnyMcPerson}!`, `Have a good sleep, ${PersonnyMcPerson}!`, `I :b:et you a cookie if you actually slept through the night! ${PersonnyMcPerson}`,
        `Sleep well ${PersonnyMcPerson}.`, `Gn ${PersonnyMcPerson}.`, `Close your eyelids and sleep, ${PersonnyMcPerson}.`, `Good night ${PersonnyMcPerson} and hope your pillow is nice and cold!`
      ]

      if (message.mentions.members.has('309373272594579456') && !client.isStaff(message.member)) message.reply('Please don\'t tag Daggerwin, read rule 14 in <#468846117405196289>');
      if (message.mentions.members.has('215497515934416896') && !client.isStaff(message.member) && message.type != 19) message.reply('Please don\'t tag Monster unless it\'s important!');
      if (PasswordArray.some(e=>message.content.toLowerCase().includes(e))) message.reply('Password and other details can be found in <#543494084363288637>');
      if (cantRead.some(e=>message.content.toLowerCase().includes(e))) message.reply('https://tenor.com/view/aristocats-george-pen-cap-meticulous-gif-5330931');
      if (message.content.toLowerCase().includes('is daggerbot working')) message.reply('https://tenor.com/view/i-still-feel-alive-living-existing-active-singing-gif-14630579');
      if (deadChat.some(e=>message.content.toLowerCase().includes(e))) message.reply('https://cdn.discordapp.com/attachments/925589318276382720/1011333656167579849/F57G5ZS.png');
      if (msgarr.includes('nawdic') && TheyBrokeIt.some(e=>msgarr.includes(e)) && client.isStaff(message.member) && message.channelId !== '516344221452599306') message.reply({embeds: [new client.embed().setTitle('*Nawdic has done an oopsie*').setImage('https://c.tenor.com/JSj9ie_MD9kAAAAC/kopfsch%C3%BCtteln-an-kopf-fassen-oh-no.gif').setColor(client.config.embedColor)]});
      if (msgarr.includes('monster') && TheyBrokeIt.some(e=>msgarr.includes(e)) && client.isStaff(message.member) && message.channelId !== '516344221452599306') message.reply({embeds: [new client.embed().setTitle('*Monster has broken something*').setImage('https://media.tenor.com/ZIzIjb_wvEoAAAAC/face-palm.gif').setColor(client.config.embedColor)]});
      if (MorningArray.some(e=>message.content.toLowerCase().startsWith(e)) && message.channelId == GeneralChatID && message.type == 0) message.reply(`${MorningPhrases[Math.floor(Math.random()*MorningPhrases.length)]}`);
      if (AfternoonArray.some(e=>message.content.toLowerCase().startsWith(e)) && message.channelId == GeneralChatID && message.type == 0) message.reply(`${AfternoonPhrases[Math.floor(Math.random()*AfternoonPhrases.length)]}`);
      if (EveningArray.some(e=>message.content.toLowerCase().startsWith(e)) && message.channelId == GeneralChatID && message.type == 0) message.reply(`${EveningPhrases[Math.floor(Math.random()*EveningPhrases.length)]}`);
      if (NightArray.some(e=>message.content.toLowerCase().startsWith(e)) && message.channelId == GeneralChatID && message.type == 0) message.reply(`${NightPhrases[Math.floor(Math.random()*NightPhrases.length)]}`);
      // Failsafe thingy (Toastproof maybe)
      if (message.content.startsWith('!!_wepanikfrfr') && client.config.whitelist.includes(message.author.id)) (client.guilds.cache.get(message.guildId) as Discord.Guild).commands.set(client.registry).then(()=>message.reply('How did you manage to lose the commands??? Anyways, it\'s re-registered now.')).catch((e:Error)=>message.reply(`Failed to deploy slash commands:\n\`\`\`${e.message}\`\`\``));
    }
  }
}
