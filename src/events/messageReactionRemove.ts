import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  run(client:TClient, reaction:Discord.MessageReaction, user:Discord.User){
    if (!client.config.botSwitches.logs) return;
    if (reaction.message.guildId != client.config.mainServer.id || reaction.message.partial) return;
    if (reaction.emoji.name === '🖕') return (client.channels.cache.get(client.config.mainServer.channels.logs) as Discord.TextChannel).send({embeds:[new client.embed().setColor(client.config.embedColorRed).setTimestamp().setAuthor({name: `Author: ${user.tag} (${user.id})`, iconURL: `${user.displayAvatarURL()}`}).setTitle('Message reaction').setDescription(`<@${user.id}>\nRemoved a reaction from the message.\n**Emoji**\n${reaction.emoji.name}\n**Channel**\n<#${reaction.message.channelId}>`)]})
  }
}
