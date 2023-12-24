import Discord from 'discord.js';
import TClient from '../client.js';
export default class MessageReactionRemove {
  static run(client:TClient, reaction:Discord.MessageReaction, user:Discord.User){
    if (!client.config.botSwitches.logs || reaction.message.guildId != client.config.dcServer.id || reaction.message.partial) return;
    if (reaction.emoji.name === '🖕') return (client.channels.cache.get(client.config.dcServer.channels.logs) as Discord.TextChannel).send({embeds:[new client.embed().setColor(client.config.embedColorRed).setTimestamp().setAuthor({name: `Author: ${user.username} (${user.id})`, iconURL: `${user.displayAvatarURL()}`}).setTitle('Message reaction').setDescription(`<@${user.id}>\nRemoved a reaction from the message.\n**Emoji**\n${reaction.emoji.name}\n**Channel**\n<#${reaction.message.channelId}>`)]})
  }
}
