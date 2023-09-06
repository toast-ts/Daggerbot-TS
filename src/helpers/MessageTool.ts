import Discord from 'discord.js';

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
}
// I want to come up with better name instead of calling this file "MessageTool", but I am super bad at naming things.
