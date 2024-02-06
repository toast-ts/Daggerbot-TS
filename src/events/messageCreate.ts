import Discord from 'discord.js';
import TClient from '../client.js';
import Response from '../modules/ResponseModule.js';
import CmdTrigger from '../modules/CmdModule.js';
import Logger from '../helpers/Logger.js';
import ConfigHelper from '../helpers/ConfigHelper.js';
import Automoderator from '../components/Automod.js';
import __PRIVATE from '../private/_.js';
import MessageTool from '../helpers/MessageTool.js';
export default class MessageCreate {
  static async run(client:TClient, message:Discord.Message) {
    if (message.author.bot) return;
    if (!message.inGuild()) return (client.channels.resolve(client.config.dcServer.channels.logs) as Discord.TextChannel).send({content: `${this.randomEmotes[Math.floor(Math.random()*this.randomEmotes.length)]} ${MessageTool.formatMention(client.config.whitelist[0], 'user')}\n**${message.author.username}** (\`${message.author.id}\`) sent me a DM, their message is:\`\`\`${message.content}\`\`\``, allowedMentions: {parse: ['users']}});
    let automodded: boolean;

    if (client.config.botSwitches.automod && !message.member.roles.cache.has(client.config.dcServer.roles.dcmod) && !message.member.roles.cache.has(client.config.dcServer.roles.admin) && message.guildId === client.config.dcServer.id) {
      const automodFailReason = 'msg got possibly deleted by another bot.';
      const automodRules = {
        phishingDetection: {
          check: async()=>await __PRIVATE.phishingDetection(message),
          action: async()=>{
            automodded = true;
            message.delete().catch(()=>Logger.console('log', 'AUTOMOD:PHISHING', automodFailReason));
            message.channel.send('Phishing links aren\'t allowed here. Nice try though!').then(msg=>setTimeout(()=>msg.delete(), 15000));
            await Automoderator.repeatedMessages(client, message, 'softban', 60000, 2, 'phish', null, 'Phishing/scam link');
          }
        },
        prohibitedWords: {
          check: async()=>await client.prohibitedWords.findWord(Automoderator.scanMsg(message)),
          action: async()=>{
            automodded = true;
            message.delete().catch(()=>Logger.console('log', 'AUTOMOD:PROHIBITEDWORDS', automodFailReason));
            message.channel.send('That word isn\'t allowed here.').then(x=>setTimeout(()=>x.delete(), 15000));
            await Automoderator.repeatedMessages(client, message, 'mute', 30000, 3, 'bw', '30m', 'Prohibited word spam');
          }
        },
        discordInvite: {
          check: ()=>message.content.toLowerCase().includes('discord.gg/') && !MessageTool.isStaff(message.member as Discord.GuildMember),
          action: async()=>{
            const validInvite = await client.fetchInvite(message.content.split(' ').find(x=>x.includes('discord.gg/'))).catch(()=>null);
            if (validInvite && validInvite.guild?.id !== client.config.dcServer.id) {
              automodded = true;
              message.delete().catch(()=>Logger.console('log', 'AUTOMOD:ADVERTISEMENT', automodFailReason));
              message.channel.send('Please don\'t advertise other Discord servers.').then(x=>setTimeout(()=>x.delete(), 15000));
              await Automoderator.repeatedMessages(client, message, 'ban', 60000, 4, 'adv', null, 'Discord advertisement');
            }
          }
        },
        imageOnly: {
          check: ()=>!MessageTool.isStaff(message.member as Discord.GuildMember),
          action: async()=>await Automoderator.imageOnly(message)
        }
      };

      for (const rule of Object.values(automodRules)) {
        if (!automodded && await rule.check()) {
          await rule.action();
          break;
        }
      }
    };
    if (message.guildId === client.config.dcServer.id && !automodded) client.userLevels.messageIncremental(message.author.id);
    // Mop gifs from banned channels without admins having to mop them.
    // const bannedChannels = []
    // if (['tenor.com/view', 'giphy.com/gifs', 'giphy.com/media'].some(e=>message.content.toLowerCase().includes(e)) && bannedChannels.includes(message.channelId)) message.reply('Gifs are not allowed in this channel.').then(()=>message.delete())

    // Autoresponse:tm:
    if (client.config.botSwitches.autores && !automodded) {
      const incomingArrays = {
        password: ['whats the password', 'what\'s the password', 'password pls'],
        cantRead: ['i cant read', 'i can\'t read', 'cant read', 'can\'t read'],
        theyBrokeIt: ['break', 'broke', 'broken'],
        mpsrv: ['is anyone online', 'is the server up', 'is anyone going on']
      }
      const outgoingArrays = {
        guildBoost: ['Thanks for boosting our server!', 'Thanks for the boost!', 'We appreciate the boost!', `Thank you for the kind boost, <@${message.author.id}>!`],
      }
      const GeneralChatID = ConfigHelper.isDevMode() ? '929807948748832801' : '468835415093411863';
      Response.create(message, GeneralChatID, 'morning');
      Response.create(message, GeneralChatID, 'afternoon');
      Response.create(message, GeneralChatID, 'evening');
      Response.create(message, GeneralChatID, 'night');

      CmdTrigger.registerCmds(client, message, 'register');
      CmdTrigger.MFPwTrigger(message, 'farmpw');

      let picStorage = {
        cantRead: 'https://tenor.com/view/aristocats-george-pen-cap-meticulous-gif-5330931',
        amAlive: 'https://tenor.com/view/i-still-feel-alive-living-existing-active-singing-gif-14630579'
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
      let dontMention = [
        {
          user_id: '309373272594579456',
          message: 'Please don\'t tag Daggerwin, read rule 14 in <#468846117405196289>',
          type: undefined
        },
        {
          user_id: '215497515934416896',
          message: 'Please don\'t tag Monster unless it\'s important!',
          type: Discord.MessageType.Default
        }
      ]

      if (message.type === Discord.MessageType.GuildBoost && message.channelId === GeneralChatID) message.channel.send({content: outgoingArrays.guildBoost[Math.floor(Math.random() * outgoingArrays.guildBoost.length)], allowedMentions: {parse: ['users']}})
      if (dontMention.some(e=>message.mentions.members.has(e.user_id) && !MessageTool.isStaff(message.member)) && (dontMention.find(e => message.mentions.has(e.user_id)).type === undefined || message.type === dontMention.find(e => message.mentions.has(e.user_id)).type)) message.reply(dontMention.find(e=>message.mentions.members.has(e.user_id)).message);

      if (incomingArrays.password.some(e=>message.content.toLowerCase().includes(e))) message.reply('Password and other details can be found in <#543494084363288637>');
      if (incomingArrays.cantRead.some(e=>message.content.toLowerCase().includes(e))) message.reply(picStorage.cantRead);
      if (message.content.toLowerCase().includes('is daggerbot working')) message.reply(picStorage.amAlive);
      if (message.channelId === '468835769092669461' && incomingArrays.mpsrv.some(e=>message.content.toLowerCase().includes(e))) message.reply('You can take a look at the embeds in <#543494084363288637> to see if anyone is on the server.');

      for (const thisPerson of ModsGoGetThisPerson) {
        if (incomingArrays.theyBrokeIt.some(x=>Automoderator.scanMsg(message).includes(x) && Automoderator.scanMsg(message).includes(thisPerson.user)) && MessageTool.isStaff(message.member) && message.channelId !== client.config.dcServer.channels.mpmod_chat)
          message.reply({embeds: [new client.embed().setTitle(thisPerson.title).setImage(thisPerson.img).setColor(client.config.embedColor)]});
      }
    }
  }
  private static randomEmotes = [
    '<:_:1083675172407623711>', '<:_:1201440990473506857>',
    '<:_:1083675175163277383>', '<:_:1083675149347340391>',
    '<:_:1139410139653353533>', '<:_:1083675155504574487>',
    '<:_:1201441007271690340>', '<:_:1060388693166264380>',
    '<:_:1084392085047758930>', '<:_:1159495459082092655>',
    '<a:_:1016297208292851762>', '<a:_:1016297221911740466>',
    '<a:_:1094804583370457268>'
  ];
}
