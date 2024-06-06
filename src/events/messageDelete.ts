import Discord from 'discord.js';
import TClient from '../client.js';
import Logger from '../helpers/Logger.js';
import {disabledChannels} from '../index.js';
export default class MessageDelete {
  static run(client:TClient, msg:Discord.Message|Discord.PartialMessage){
    if (!client.config.botSwitches.logs) return;
    if (msg.guild?.id != client.config.dcServer.id || msg.partial || msg.author.bot || disabledChannels.includes(msg.channelId)) return;
    if (Discord.DiscordAPIError.name === '10008') return Logger.console('log', 'MsgDelete', 'Caught an unexpected error returned by Discord API. (Unknown Message)');
    const embed = new client.embed().setColor(client.config.embedColorRed).setTimestamp().setAuthor({name: `Author: ${msg.author.username} (${msg.author.id})`, iconURL: `${msg.author.displayAvatarURL()}`}).setTitle('Message deleted');
    if (msg.content.length != 0) embed.addFields({name: 'Content', value: `\`\`\`\n${Discord.escapeCodeBlock(msg.content.slice(0,1000))}\n\`\`\``});
    embed.addFields(
      {name: 'Channel', value: `<#${msg.channelId}>`},
      {name: 'Sent at', value: `<t:${Math.round(msg.createdTimestamp/1000)}>\n<t:${Math.round(msg.createdTimestamp/1000)}:R>`}
    )
    const attachments:string[] = [];
    for (const attachment of msg.attachments.values()) attachments.push(attachment.proxyURL);
    (client.channels.cache.get(client.config.dcServer.channels.bot_log) as Discord.TextChannel).send({embeds: [embed], files: attachments});
  }
}
