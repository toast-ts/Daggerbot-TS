import Discord from 'discord.js';
import TClient from '../client.js';
export default class MessageReactionAdd {
  static run(client:TClient, reaction:Discord.MessageReaction, user:Discord.User){
    if (!client.config.botSwitches.logs) return;
    if (reaction.message.guildId != client.config.dcServer.id || reaction.message.partial) return;
    const ReactedFirst = reaction.users.cache.first();
    if (ReactedFirst.id != user.id) return;
    if (reaction.emoji.name === '🖕') return (client.channels.cache.get(client.config.dcServer.channels.logs) as Discord.TextChannel).send({embeds:[new client.embed().setColor(client.config.embedColorYellow).setTimestamp().setAuthor({name: `Author: ${ReactedFirst.username} (${ReactedFirst.id})`, iconURL: `${ReactedFirst.displayAvatarURL()}`}).setTitle('Message reaction').setDescription(`<@${ReactedFirst.id}>\nAdded a reaction to the message.\n**Emoji**\n${reaction.emoji.name}\n**Channel**\n<#${reaction.message.channelId}>`).setFooter({text: 'Possibly this member, bot fetches who reacted first.'})], components: [new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(new Discord.ButtonBuilder().setStyle(5).setURL(`${reaction.message.url}`).setLabel('Jump to message'))]});
  }
}
