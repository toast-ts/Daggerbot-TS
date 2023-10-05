import Discord from 'discord.js';
import TClient from '../client.js';

export default class Automoderator {
  static Whitelist(message:Discord.Message, ...arr:string[]){// Array of channel ids for automod to be disabled in (Disables bannedWords and advertisement, mind you.)
    return arr.includes(message.channelId);
  }
  static scanMsg(message:Discord.Message){
    return message.content.toLowerCase().replaceAll(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\n?0-9]/g, '').split(' ')
  }
  static async repeatedMessages(client:TClient, message:Discord.Message, thresholdTime:number, thresholdAmount:number, type:string, muteTime:string, muteReason:string){
    if (client.repeatedMessages[message.author.id]){
      // Add message to the list
      client.repeatedMessages[message.author.id].data.set(message.createdTimestamp, {type, channel: message.channelId});

      // Reset the timeout
      clearTimeout(client.repeatedMessages[message.author.id].timeout);
      client.repeatedMessages[message.author.id].timeout = setTimeout(()=>delete client.repeatedMessages[message.author.id], thresholdTime);

      // Message sent after (now - threshold), so purge those that were sent earlier
      client.repeatedMessages[message.author.id].data = client.repeatedMessages[message.author.id].data.filter((_,i)=>i >= Date.now() - thresholdTime);

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
}
