import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
import Automoderator from '../components/Automod.js';
import {disabledChannels, rawSwitches} from '../index.js';
export default class MessageUpdate {
  static async run(client:TClient, oldMsg:Discord.Message|Discord.PartialMessage, newMsg:Discord.Message){
    if (!client.config.botSwitches.logs) return;
    if (oldMsg.guild?.id != client.config.dcServer.id || oldMsg.author === null || oldMsg?.author.bot || newMsg.partial || !newMsg.member || newMsg.content === oldMsg.content || disabledChannels.includes(newMsg.channelId)) return;
    if (await client.prohibitedWords.findWord(Automoderator.scanMsg(newMsg)) && (!MessageTool.isStaff(newMsg.member))) newMsg.delete();
    if (!rawSwitches.MESSAGE_UPDATE || rawSwitches.MESSAGE_UPDATE) {
      rawSwitches.MESSAGE_UPDATE = true;
      (client.channels.resolve(client.config.dcServer.channels.logs) as Discord.TextChannel).send({embeds: [new client.embed().setColor(client.config.embedColor).setTimestamp().setAuthor({name: `Author: ${oldMsg.author.username} (${oldMsg.author.id})`, iconURL: oldMsg.author.displayAvatarURL()}).setTitle('Message edited').addFields({name: 'Old content', value: `\`\`\`${oldMsg.content.length < 1 ? '(Attachment)' : Discord.escapeCodeBlock(oldMsg.content.slice(0,2048))}\`\`\``}, {name: 'New content', value: `\`\`\`${Discord.escapeCodeBlock(newMsg.content.slice(0,2048))}\`\`\``}, {name: 'Channel', value: `<#${oldMsg.channelId}>`})], components: [new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(new Discord.ButtonBuilder().setStyle(5).setURL(oldMsg.url).setLabel('Jump to message'))]});
    }
  }
}
