import Discord, { ActionRowBuilder, ButtonBuilder } from 'discord.js';
import TClient from '../client';
export default {
  async run(client:TClient, oldMsg:Discord.Message, newMsg:Discord.Message){
    if (!client.config.botSwitches.logs) return;
    const disabledChannels = ['548032776830582794', '541677709487505408', '949380187668242483']
    if (oldMsg.guild?.id != client.config.mainServer.id || oldMsg.author == null || oldMsg?.author.bot || oldMsg.partial || newMsg.partial || !newMsg.member || disabledChannels.includes(newMsg.channelId)) return;
    const msgarr = newMsg.content.toLowerCase().replaceAll(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\n]/g, ' ').split(' ');
    if (await client.bannedWords._content.findOne({_id:msgarr}) && (!client.isStaff(newMsg.member))) newMsg.delete();
    if (newMsg.content === oldMsg.content) return;
    (client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds: [new client.embed().setColor(client.config.embedColor).setTimestamp().setAuthor({name: `Author: ${oldMsg.author.tag} (${oldMsg.author.id})`, iconURL: `${oldMsg.author.displayAvatarURL()}`}).setTitle('Message edited').setDescription(`<@${oldMsg.author.id}>\nOld content:\n\`\`\`\n${oldMsg.content.length < 1 ? '(Attachment)' : oldMsg.content}\n\`\`\`\nNew content:\n\`\`\`\n${newMsg.content}\`\`\`\nChannel: <#${oldMsg.channelId}>`)], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(5).setURL(`${oldMsg.url}`).setLabel('Jump to message'))]});
  }
}
