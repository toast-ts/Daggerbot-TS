import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
import {escapeCodeBlock} from 'discord.js';
export default {
  async run(client:TClient, oldMsg:Discord.Message, newMsg:Discord.Message){
    if (!client.config.botSwitches.logs) return;
    if (oldMsg.guild?.id != client.config.mainServer.id || oldMsg.author === null || oldMsg?.author.bot || oldMsg.partial || newMsg.partial || !newMsg.member || ['548032776830582794', '541677709487505408', '949380187668242483'].includes(newMsg.channelId)) return;
    if (await client.bannedWords._content.findOne({_id:newMsg.content.toLowerCase().replaceAll(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\n]/g, ' ').split(' ')}) && (!MessageTool.isStaff(newMsg.member))) newMsg.delete();
    if (newMsg.content === oldMsg.content) return;
    (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [new client.embed().setColor(client.config.embedColor).setTimestamp().setAuthor({name: `Author: ${oldMsg.author.username} (${oldMsg.author.id})`, iconURL: `${oldMsg.author.displayAvatarURL()}`}).setTitle('Message edited').setDescription(`<@${oldMsg.author.id}>\nOld content:\n\`\`\`\n${oldMsg.content.length < 1 ? '(Attachment)' : escapeCodeBlock(oldMsg.content.slice(0,2048))}\n\`\`\`\nNew content:\n\`\`\`\n${escapeCodeBlock(newMsg.content.slice(0,2048))}\`\`\`\nChannel: <#${oldMsg.channelId}>`)], components: [new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(new Discord.ButtonBuilder().setStyle(5).setURL(`${oldMsg.url}`).setLabel('Jump to message'))]});
  }
}
