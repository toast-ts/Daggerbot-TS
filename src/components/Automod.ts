import Discord from 'discord.js';
import TClient from '../client.js';
import Logger from '../helpers/Logger.js';
export default class Automoderator {
  private static logPrefix:string = 'Automod';
  private static lockQuery:Set<Discord.Snowflake> = new Set();
  static scanMsg =(message:Discord.Message)=>message.content.toLowerCase().replaceAll(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\n?0-9]|ing\b|ed\b|es\b|er\b/g, '').split('').join('');
  static async repeatedMessages(client:TClient, message:Discord.Message, action:'mute'|'ban'|'softban', thresholdTime:number, thresholdAmount:number, type:string, duration:string, reason:string) {
    const now = Date.now();

    if (!client.repeatedMessages[message.author.id]) client.repeatedMessages[message.author.id] = {type: type, count:1, firstTime:now, timeout: null};
    else {
      const data = client.repeatedMessages[message.author.id];
      if (now - data.firstTime < thresholdTime) {
        // If the message is within the threshold time, increment.
        data.count++;
        if (data.count >= thresholdAmount) {
          // If the count has reached the threshold amount, punish the user like most daddy would do to their child.
          if (!this.lockQuery.has(message.author.id)) {
            this.lockQuery.add(message.author.id);
            Logger.console('log', this.logPrefix, `Lock acquired for ${message.author.tag} with reason: ${reason}`);
            await client.punishments.punishmentAdd(action, {time: duration}, client.user.id, `AUTOMOD:${reason}`, message.author, message.member as Discord.GuildMember);
            setTimeout(()=>{
              this.lockQuery.delete(message.author.id);
              Logger.console('log', this.logPrefix, `Lock released for ${message.author.tag}`);
            }, 3500); // Wait 3.5 seconds before releasing the lock.
          }
          delete client.repeatedMessages[message.author.id];
        }
      } else {
        // If the message is outside the threshold time, reset the count and timestamp.
        data.count = 1;
        data.firstTime = now;
      }
      // Reset the timer.
      clearTimeout(data.timeout);
      data.timeout = setTimeout(()=>delete client.repeatedMessages[message.author.id], thresholdTime);
    }
  }
  static isSpam(client:TClient, message:Discord.Message, threshold:number): boolean {
    const now = Date.now();
    const time = 30000;

    if (!client.repeatedMessages[message.author.id]) client.repeatedMessages[message.author.id] = {type: 'spam', count: 1, firstTime: now, timeout: null};
    else {
      const data = client.repeatedMessages[message.author.id];
      if (now - data.firstTime < time) {
        data.count++;
        if (data.count >= threshold) return true;
      } else {
        data.count = 1;
        data.firstTime = now;
      }
      clearTimeout(data.timeout);
      data.timeout = setTimeout(()=>delete client.repeatedMessages[message.author.id], time);
    }
    return false;
  }
  static async imageOnly(message:Discord.Message) {
    const io_channels = ['468896467688620032'];
    let deleteReason:string = 'This is an image-only channel and your message did not contain any images.';
    if (io_channels.includes(message.channelId) && message.attachments.size < 1 && message.attachments.every(x=>!x.contentType.includes('image/'))) await message.delete().then(()=>message.channel.send(deleteReason).then((msg:Discord.Message)=>setTimeout(()=>msg.delete(), 8000)));
  }
}
