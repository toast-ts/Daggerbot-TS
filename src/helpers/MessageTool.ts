import Discord from 'discord.js';
import {readFileSync} from 'node:fs';
import {Config} from 'src/typings/interfaces';
const config:Config = JSON.parse(readFileSync('src/config.json', 'utf8'));
type RoleKeys = keyof typeof config.mainServer.roles;

export default class MessageTool {
  static embedMusic(color:Discord.ColorResolvable, title:string, thumbnail?:string, footer?:string){
    const embed = new Discord.EmbedBuilder().setColor(color).setTitle(title);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (footer) embed.setFooter({text: footer});
    return embed
  }
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
