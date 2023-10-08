import Discord from 'discord.js';
import ConfigHelper from './ConfigHelper.js';
const config = ConfigHelper.readConfig();
type RoleKeys = keyof typeof config.mainServer.roles;

export default class MessageTool {
  static embedStruct(color:Discord.ColorResolvable, title:string, description?:string|null, image?:string|null){
    const embed = new Discord.EmbedBuilder().setColor(color).setTitle(title);
    if (description) embed.setDescription(description);
    if (image) embed.setImage(image);
    return embed
  }
  static concatMessage(...messages:string[]){
    return messages.join('\n')
  }
  static formatMention(mention:string, type:'user'|'channel'|'role'){
    return `<@${type === 'role' ? '&' : type === 'channel' ? '#' : ''}${mention}>`
  }
  static isStaff(guildMember:Discord.GuildMember){
    return config.mainServer.staffRoles.map((x:string)=>config.mainServer.roles[x]).some((x:string)=>guildMember.roles.cache.has(x));
  }
  static youNeedRole(interaction:Discord.CommandInteraction, role:RoleKeys){
    return interaction.reply(`This command is restricted to ${this.formatMention(config.mainServer.roles[role], 'role')}`);
  }
}
// I want to come up with better name instead of calling this file "MessageTool", but I am super bad at naming things.
