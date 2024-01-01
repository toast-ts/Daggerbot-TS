import Discord from 'discord.js';
import TClient from '../client.js';
import Response from '../modules/ResponseModule.js';
import CmdTrigger from '../modules/CmdModule.js';
import Logger from '../helpers/Logger.js';
import ConfigHelper from '../helpers/ConfigHelper.js';
import Automoderator from '../components/Automod.js';
import MessageTool from '../helpers/MessageTool.js';
export default class MessageCreate {
  static async run(client:TClient, message:Discord.Message){
    if (message.author.bot) return;
    if (!message.inGuild()) return (client.channels.resolve(client.config.dcServer.channels.logs) as Discord.TextChannel).send({content: `<:fish_unamused:1083675172407623711> ${MessageTool.formatMention(client.config.whitelist[0], 'user')}\n**${message.author.username}** (\`${message.author.id}\`) tried to send me a DM, their message is:\`\`\`${message.content}\`\`\``, allowedMentions: {parse: ['users']}});
    let automodded: boolean;

    if (client.config.botSwitches.automod && !message.member.roles.cache.has(client.config.dcServer.roles.dcmod) && !message.member.roles.cache.has(client.config.dcServer.roles.admin) && message.guildId === client.config.dcServer.id){
      const automodFailReason = 'msg got possibly deleted by another bot.';
      if (await client.prohibitedWords.findWord(Automoderator.scanMsg(message))/*  && !Whitelist.includes(message.channelId) */) {
        automodded = true;
        message.delete().catch(()=>Logger.console('log', 'AUTOMOD:PROHIBITEDWORDS', automodFailReason));
        message.channel.send('That word isn\'t allowed here.').then(x=>setTimeout(()=>x.delete(), 10000));
        await Automoderator.repeatedMessages(client, message, 30000, 3, 'bw', '30m', 'Prohibited word spam');
      } else if (message.content.toLowerCase().includes('discord.gg/') && !MessageTool.isStaff(message.member as Discord.GuildMember)) {
        const validInvite = await client.fetchInvite(message.content.split(' ').find(x=>x.includes('discord.gg/'))).catch(()=>null);
        if (validInvite && validInvite.guild?.id !== client.config.dcServer.id) {
          automodded = true;
          message.delete().catch(()=>Logger.console('log', 'AUTOMOD:ADVERTISEMENT', automodFailReason));
          message.channel.send('Please don\'t advertise other Discord servers.').then(x=>setTimeout(()=>x.delete(), 15000));
          await Automoderator.repeatedMessages(client, message, 60000, 2, 'adv', '1h', 'Discord advertisement');
        }
      }
    }

    if (message.guildId === client.config.dcServer.id && !automodded) client.userLevels.messageIncremental(message.author.id);
    // Mop gifs from banned channels without Monster having to mop them.
    const bannedChannels = [
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
      const outgoingArrays = {
        guildBoost: ['Thanks for boosting our server!', 'Thanks for the boost!', 'We appreciate the boost!', `Thank you for the kind boost, <@${message.author.id}>!`],
      }
      const GeneralChatID = ConfigHelper.isDevMode() ? '1160707096493441056' : '468835415093411863';
      Response.create(client, message, GeneralChatID, 'morning');
      Response.create(client, message, GeneralChatID, 'afternoon');
      Response.create(client, message, GeneralChatID, 'evening');
      Response.create(client, message, GeneralChatID, 'night');

      CmdTrigger.registerCmds(client, message, 'register');
      CmdTrigger.MFPwTrigger(message, 'farmpw');

      let picStorage = {
        cantRead: 'https://tenor.com/view/aristocats-george-pen-cap-meticulous-gif-5330931',
        amAlive: 'https://tenor.com/view/i-still-feel-alive-living-existing-active-singing-gif-14630579',
        deadChat: 'https://cdn.discordapp.com/attachments/925589318276382720/1011333656167579849/F57G5ZS.png',
      };
      let ModsGoGetThisPerson = [// I find this variable amusing but also can't think of anything better so not changing it.
        {
          user: 'nawdic',
          img: 'https://c.tenor.com/JSj9ie_MD9kAAAAC/kopfsch%C3%BCtteln-an-kopf-fassen-oh-no.gif',
          title: '*Nawdic has done an oopsie*',
        },
        {
          user: 'monster',
          img: 'https://media.tenor.com/ZIzIjb_wvEoAAAAC/face-palm.gif',
          title: '*Monster has broken something*',
        }
      ];

      if (message.type === Discord.MessageType.GuildBoost && message.channelId === GeneralChatID) message.channel.send({content: outgoingArrays.guildBoost[Math.floor(Math.random() * outgoingArrays.guildBoost.length)], allowedMentions: {parse: ['users']}})
      if (message.mentions.members.has('309373272594579456') && !MessageTool.isStaff(message.member)) message.reply('Please don\'t tag Daggerwin, read rule 14 in <#468846117405196289>');
      if (message.mentions.members.has('215497515934416896') && !MessageTool.isStaff(message.member) && message.type != Discord.MessageType.Reply) message.reply('Please don\'t tag Monster unless it\'s important!');
      if (incomingArrays.password.some(e=>message.content.toLowerCase().includes(e))) message.reply('Password and other details can be found in <#543494084363288637>');
      if (incomingArrays.cantRead.some(e=>message.content.toLowerCase().includes(e))) message.reply(picStorage.cantRead);
      if (message.content.toLowerCase().includes('is daggerbot working')) message.reply(picStorage.amAlive);
      if (incomingArrays.deadChat.some(e=>message.content.toLowerCase().includes(e))) message.reply(picStorage.deadChat);

      for (const thisPerson of ModsGoGetThisPerson) {
        if (incomingArrays.theyBrokeIt.some(x=>Automoderator.scanMsg(message).includes(x) && Automoderator.scanMsg(message).includes(thisPerson.user)) && MessageTool.isStaff(message.member) && message.channelId !== client.config.dcServer.channels.mpmod_chat)
          message.reply({embeds: [new client.embed().setTitle(thisPerson.title).setImage(thisPerson.img).setColor(client.config.embedColor)]});
      }
    }
  }
}
