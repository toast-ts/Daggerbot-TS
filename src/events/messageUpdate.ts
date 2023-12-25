import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
export default class MessageUpdate {
  static async run(client:TClient, oldMsg:Discord.Message, newMsg:Discord.Message){
    if (!client.config.botSwitches.logs) return;
    if (oldMsg.guild?.id != client.config.dcServer.id || oldMsg.author === null || oldMsg?.author.bot || oldMsg.partial || newMsg.partial || !newMsg.member || ['548032776830582794', '541677709487505408', '949380187668242483'].includes(newMsg.channelId)) return;
    if (await client.prohibitedWords.findWord(newMsg.content.toLowerCase().replaceAll(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\n?0-9]|[]|ing\b/g, '').split(' ').join('')) && (!MessageTool.isStaff(newMsg.member))) newMsg.delete();
    if (newMsg.content === oldMsg.content) return;
    (client.channels.resolve(client.config.dcServer.channels.logs) as Discord.TextChannel).send({embeds: [new client.embed().setColor(client.config.embedColor).setTimestamp().setAuthor({name: `Author: ${oldMsg.author.username} (${oldMsg.author.id})`, iconURL: oldMsg.author.displayAvatarURL()}).setTitle('Message edited').setDescription(`<@${oldMsg.author.id}>\n\`${oldMsg.author.id}\``).addFields({name: 'Old content', value: `\`\`\`${oldMsg.content.length < 1 ? '(Attachment)' : Discord.escapeCodeBlock(oldMsg.content.slice(0,2048))}\`\`\``}, {name: 'New content', value: `\`\`\`${Discord.escapeCodeBlock(newMsg.content.slice(0,2048))}\`\`\``}, {name: 'Channel', value: `<#${oldMsg.channelId}>`})], components: [new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(new Discord.ButtonBuilder().setStyle(5).setURL(oldMsg.url).setLabel('Jump to message'))]});
  }
}
