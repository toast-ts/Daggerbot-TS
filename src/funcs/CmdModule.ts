import Discord from 'discord.js';
import TClient from '../client.js';

export default class CmdTrigger {
  static registerCmds(client:TClient, message:Discord.Message, trigger:string) {
    if (message.content.startsWith(trigger) && client.config.whitelist.includes(message.author.id)) {
      (client.guilds.cache.get(message.guildId) as Discord.Guild).commands.set(client.registry)
      .then(()=>message.reply('How did you manage to lose the commands??? Anyways, it\'s re-registered now.'))
      .catch((e:Error)=>message.reply(`Failed to deploy slash commands:\n\`\`\`${e.message}\`\`\``));
    }
  }
}
