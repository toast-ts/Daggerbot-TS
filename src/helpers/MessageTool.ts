import Discord from 'discord.js';
import ConfigHelper from './ConfigHelper.js';
const config = ConfigHelper.readConfig();
type RoleKeys = keyof typeof config.dcServer.roles;

export default class MessageTool {
  static embedStruct(color:Discord.ColorResolvable, title:string, description?:string|null, image?:string|null) {
    const embed = new Discord.EmbedBuilder().setColor(color).setTitle(title);
    if (description) embed.setDescription(description);
    if (image) embed.setImage(image);
    return embed
  }
  static concatMessage =(...messages:string[])=>messages.join('\n');
  static formatMention =(mention:string, type:'user'|'channel'|'role')=>`<${type === 'role' ? '@&' : type === 'channel' ? '#' : '@'}${mention}>`;
  static isStaff =(guildMember:Discord.GuildMember)=>config.dcServer.staffRoles.map((x:string)=>config.dcServer.roles[x]).some((x:string)=>guildMember.roles.cache.has(x));
  static youNeedRole =(interaction:Discord.CommandInteraction, role:RoleKeys)=>interaction.reply(`You do not have ${this.formatMention(config.dcServer.roles[role], 'role')} role to use this command.`);
  static isModerator =(guildMember:Discord.GuildMember)=>config.dcServer.staffRoles.filter((x:string)=>/^admin|^dcmod/.test(x)).map((x:string)=>config.dcServer.roles[x]).some((x:string)=>guildMember.roles.cache.has(x));
}
