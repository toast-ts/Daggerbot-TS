import Discord from 'discord.js';
import TClient from '../client.js';
import Response from '../funcs/ResponseSystem.js';
export default {
  async run(client:TClient, message:Discord.Message){
    if (message.author.bot) return;
    if (!message.inGuild()) return (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send({content: `<:fish_unamused:1083675172407623711> <@${client.config.whitelist[0]}>\n**${message.author.username}** tried to send me a DM, their message is:\`\`\`${message.content}\`\`\``, allowedMentions: {parse: ['users']}});

    const msgarr = message.content.toLowerCase().replaceAll(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\n?0-9]/g, '').split(' ');
    let automodded: boolean;

    //const Whitelist = [] // Array of channel ids for automod to be disabled in (Disables bannedWords and advertisement, mind you.)

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
          await client.punishments.addPunishment('mute', {time: muteTime}, (client.user as Discord.User).id, `[AUTOMOD] ${muteReason}`, message.author, message.member as Discord.GuildMember);
        }
      } else {
        client.repeatedMessages[message.author.id] = {data: new client.collection(), timeout: setTimeout(()=>delete client.repeatedMessages[message.author.id], thresholdTime)};
        client.repeatedMessages[message.author.id].data.set(message.createdTimestamp, {type, channel: message.channelId});
      }
    }

    if (client.config.botSwitches.automod && !message.member.roles.cache.has(client.config.mainServer.roles.admin) && message.guildId == client.config.mainServer.id){
      if (await client.bannedWords._content.findById(msgarr)/*  && !Whitelist.includes(message.channelId) */){
        automodded = true;
        message.delete().catch(()=>console.log('bannedWords automod; msg got possibly deleted by another bot.'));
        message.channel.send('That word isn\'t allowed here.').then(x=>setTimeout(()=>x.delete(), 10000));
        await repeatedMessages(30000, 3, 'bw', '30m', 'Constant swearing');
      } else if (message.content.toLowerCase().includes('discord.gg/') && !client.isStaff(message.member as Discord.GuildMember)){
        const url = message.content.split(' ').find(x=>x.includes('discord.gg/'));
        const validInvite = await client.fetchInvite(url).catch(()=>undefined);
        if (validInvite && validInvite.guild?.id !== client.config.mainServer.id){
          automodded = true;
          message.delete().catch(()=>console.log('Advertisement automod; msg got possibly deleted by another bot.'));
          message.channel.send('Please don\'t advertise other Discord servers.').then(x=>setTimeout(()=>x.delete(), 15000));
          await repeatedMessages(60000, 2, 'adv', '1h', 'Discord advertisement');
        }
      }
    }

    if (message.guildId === client.config.mainServer.id && !automodded) client.userLevels.incrementUser(message.author.id)
    // Mop gifs from banned channels without Monster having to mop them.
    const bannedChannels = [
      '516344221452599306', // #mp-moderators
      '742324777934520350', // #discord-moderators
    ]
    if (['tenor.com/view', 'giphy.com/gifs', 'giphy.com/media'].some(e=>message.content.toLowerCase().includes(e)) && bannedChannels.includes(message.channelId)) message.reply('Gifs are not allowed in this channel.').then(()=>message.delete())

    // Autoresponse:tm:
    if (client.config.botSwitches.autores && !automodded) {
      const incomingArrays = {
        password: ['whats the password', 'what\'s the password', 'password pls'],
        cantRead: ['i cant read', 'i can\'t read', 'cant read', 'can\'t read'],
        theyBrokeIt: ['break', 'broke', 'broken'],
        deadChat: ['dead chat', 'chat is dead', 'dead server', 'inactive chat', 'inactive channel']
      }
      const GeneralChatID = '929807948748832801';
      Response.create(client, message, GeneralChatID, 'morning');
      Response.create(client, message, GeneralChatID, 'afternoon');
      Response.create(client, message, GeneralChatID, 'evening');
      Response.create(client, message, GeneralChatID, 'night');

      if (message.mentions.members.has('309373272594579456') && !client.isStaff(message.member)) message.reply('Please don\'t tag Daggerwin, read rule 14 in <#468846117405196289>');
      if (message.mentions.members.has('215497515934416896') && !client.isStaff(message.member) && message.type != 19) message.reply('Please don\'t tag Monster unless it\'s important!');
      if (incomingArrays.password.some(e=>message.content.toLowerCase().includes(e))) message.reply('Password and other details can be found in <#543494084363288637>');
      if (incomingArrays.cantRead.some(e=>message.content.toLowerCase().includes(e))) message.reply('https://tenor.com/view/aristocats-george-pen-cap-meticulous-gif-5330931');
      if (message.content.toLowerCase().includes('is daggerbot working')) message.reply('https://tenor.com/view/i-still-feel-alive-living-existing-active-singing-gif-14630579');
      if (incomingArrays.deadChat.some(e=>message.content.toLowerCase().includes(e))) message.reply('https://cdn.discordapp.com/attachments/925589318276382720/1011333656167579849/F57G5ZS.png');
      if (msgarr.includes('nawdic') && incomingArrays.theyBrokeIt.some(e=>msgarr.includes(e)) && client.isStaff(message.member) && message.channelId !== '516344221452599306') message.reply({embeds: [new client.embed().setTitle('*Nawdic has done an oopsie*').setImage('https://c.tenor.com/JSj9ie_MD9kAAAAC/kopfsch%C3%BCtteln-an-kopf-fassen-oh-no.gif').setColor(client.config.embedColor)]});
      if (msgarr.includes('monster') && incomingArrays.theyBrokeIt.some(e=>msgarr.includes(e)) && client.isStaff(message.member) && message.channelId !== '516344221452599306') message.reply({embeds: [new client.embed().setTitle('*Monster has broken something*').setImage('https://media.tenor.com/ZIzIjb_wvEoAAAAC/face-palm.gif').setColor(client.config.embedColor)]});
      // Failsafe thingy (Toastproof maybe)
      if (message.content.startsWith('!!_wepanikfrfr') && client.config.whitelist.includes(message.author.id)) (client.guilds.cache.get(message.guildId) as Discord.Guild).commands.set(client.registry).then(()=>message.reply('How did you manage to lose the commands??? Anyways, it\'s re-registered now.')).catch((e:Error)=>message.reply(`Failed to deploy slash commands:\n\`\`\`${e.message}\`\`\``));
    }
  }
}
