import Discord from 'discord.js';
import MessageTool from './MessageTool.js';
import ConfigHelper from './ConfigHelper.js';
const config = ConfigHelper.readConfig();
export default class FAQStore {
  protected static readonly errorMsg:string = 'Failed to send the message, please report to **Toast** if it continues.';
  static async reply(interaction:Discord.ChatInputCommandInteraction, title:string|null, message:string, image:string|null, useEmbed:boolean=false) {
    if (useEmbed) return interaction.reply({embeds: [MessageTool.embedStruct(config.embedColor, title, message, image)]}).catch(err=>interaction.reply(this.errorMsg+'\n'+err))
    else return interaction.reply(message).catch(err=>interaction.reply(this.errorMsg+'\n'+err))
  }
}
