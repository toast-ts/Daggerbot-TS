import {Message, Guild} from 'discord.js';
import TClient from '../client.js';

export default class CmdTrigger {
  private static readonly prefix = '!!_';
  private static SenseTrigger(message:Message, trigger:string): boolean {
    return message.content.toLowerCase().startsWith(this.prefix+trigger)
  }
  static registerCmds(client:TClient, message:Message, trigger:string) {
    if (this.SenseTrigger(message, trigger) && client.config.whitelist.includes(message.author.id)) {
      (client.guilds.cache.get(message.guildId) as Guild).commands.set(client.registry)
        .then(()=>message.reply('Deployed the slash commands successfully!'))
        .catch(e=>message.reply(`Failed to deploy slash commands:\n\`\`\`${e.message}\`\`\``));
    }
  }
  static MFPwTrigger(message:Message, trigger:string) {
    if (this.SenseTrigger(message, trigger)) {
      let passwordText = 'The farm password is ';
      const mapping = {
        '1149138133514981386': 'koops',
        '1149138202662293555': 'junkers'
      }
      for (const [channelId, farmPw] of Object.entries(mapping)) {
        if (message.channelId === channelId) message.reply(passwordText += `\`${farmPw}\``);
      }
    }
  }
}
