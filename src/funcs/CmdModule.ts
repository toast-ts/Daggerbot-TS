import Discord from 'discord.js';
import TClient from '../client.js';

export default class CmdTrigger {
  private static readonly prefix = '!!_';
  private static SenseTrigger(message:Discord.Message, trigger:string): boolean {
    return message.content.toLowerCase().startsWith(this.prefix+trigger)
  }
  static registerCmds(client:TClient, message:Discord.Message, trigger:string) {
    if (this.SenseTrigger(message, trigger) && client.config.whitelist.includes(message.author.id)) {
      (client.guilds.cache.get(message.guildId) as Discord.Guild).commands.set(client.registry)
        .then(()=>message.reply('How did you manage to lose the commands??? Anyways, it\'s re-registered now.'))
        .catch((e:Error)=>message.reply(`Failed to deploy slash commands:\n\`\`\`${e.message}\`\`\``));
    }
  }
  static MFPwTrigger(message:Discord.Message, trigger:string) {
    if (this.SenseTrigger(message, trigger)) {
      let farmPwText = 'The farm password is ';
      if (message.channelId === '1149138133514981386') return message.reply(farmPwText += '`westfarm`')
      else if (message.channelId === '1149138202662293555') return message.reply(farmPwText += '`eastfarm`')
    }
  }
}
