import Discord from 'discord.js';
import TClient from '../client.js';
import Logger from '../helpers/Logger.js';
import MessageTool from '../helpers/MessageTool.js';
import Automoderator from '../components/Automod.js';
import {disabledChannels, rawSwitches} from '../index.js';
export default class MessageUpdate {
  static async run(client:TClient, oldMsg:Discord.Message|Discord.PartialMessage, newMsg:Discord.Message){
    if (!client.config.botSwitches.logs) return;
    if (oldMsg.guild?.id != client.config.dcServer.id || oldMsg.author === null || oldMsg?.author.bot || newMsg.partial || !newMsg.member || newMsg.content === oldMsg.content || disabledChannels.includes(newMsg.channelId)) return;
    if (await client.prohibitedWords.findWord(Automoderator.scanMsg(newMsg)) && (!MessageTool.isStaff(newMsg.member))) newMsg.delete();
    let is_truncated = false;
    if (newMsg.content.length >= 1024) {
      Logger.console('log', 'MessageUpdate', 'Received a message from API that couldn\'t fit in the embed\'s field value. Truncating...');
      is_truncated = true;
    }
    if (!rawSwitches.MESSAGE_UPDATE || rawSwitches.MESSAGE_UPDATE) {
      rawSwitches.MESSAGE_UPDATE = true;
      (client.channels.resolve(client.config.dcServer.channels.bot_log) as Discord.TextChannel).send({content: is_truncated ? 'Message has been truncated as it couldn\'t fit' : undefined, embeds: [new client.embed().setColor(client.config.embedColor).setTimestamp().setAuthor({name: `Author: ${oldMsg.author.username} (${oldMsg.author.id})`, iconURL: oldMsg.author.displayAvatarURL()}).setTitle('Message edited').addFields({name: 'Old content', value: `\`\`\`${oldMsg.content.length < 1 ? '(Attachment)' : Discord.escapeCodeBlock(oldMsg.content.slice(0,1000))}\`\`\``}, {name: 'New content', value: `\`\`\`${Discord.escapeCodeBlock(newMsg.content.slice(0,1000))}\`\`\``}, {name: 'Channel', value: `<#${oldMsg.channelId}>`})], components: [new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(new Discord.ButtonBuilder().setStyle(5).setURL(oldMsg.url).setLabel('Jump to message'))]});
    }
  }
}
