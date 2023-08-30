import Discord from 'discord.js';

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
}
// I want to come up with better name instead of calling this file "MessageTool", but I am super bad at naming things.
