import Discord from 'discord.js';
import ConfigHelper from './ConfigHelper.js';
const config = ConfigHelper.readConfig();

export default class MessageTool {
  public static embedStruct(color:Discord.ColorResolvable, title:string, description?:string|null, image?:string|null) {
    const embed = new Discord.EmbedBuilder().setColor(color).setTitle(title);
    if (description) embed.setDescription(description);
    if (image) embed.setImage(image);
    return embed
  }
  public static concatMessage =(...messages:string[])=>messages.join('\n');
  public static formatMention =(mention:string, type:'user'|'channel'|'role')=>`<${type === 'role' ? '@&' : type === 'channel' ? '#' : '@'}${mention}>`;
  public static isStaff =(guildMember:Discord.GuildMember)=>config.dcServer.staffRoles.map((x:string)=>config.dcServer.roles[x]).some((x:string)=>guildMember.roles.cache.has(x));
  public static youNeedRole =(interaction:Discord.CommandInteraction, role:keyof typeof config.dcServer.roles)=>interaction.reply(`You do not have ${this.formatMention(config.dcServer.roles[role], 'role')} role to use this command.`);
  public static isModerator =(guildMember:Discord.GuildMember)=>config.dcServer.staffRoles.filter((x:string)=>/^admin|^dcmod/.test(x)).map((x:string)=>config.dcServer.roles[x]).some((x:string)=>guildMember.roles.cache.has(x));
}
