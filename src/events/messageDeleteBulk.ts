import Discord from 'discord.js';
import TClient from '../client.js';
export default class MessageDeleteBulk {
  static run(client:TClient, messages:Discord.Collection<string, Discord.Message<boolean>>, channel:Discord.GuildTextBasedChannel){
    if (!client.config.botSwitches.logs || channel.guildId != client.config.dcServer.id) return;
    (client.channels.resolve(client.config.dcServer.channels.logs) as Discord.TextChannel).send({embeds: [new client.embed().setColor(client.config.embedColorRed).setTimestamp().setTitle(`${messages.size} messages were purged`).setDescription(`\`\`\`${messages.map(msgs=>`${msgs.author?.username}: ${msgs.content}`).reverse().join('\n').slice(0,3900)}\`\`\``).addFields({name: 'Channel', value: `<#${messages.first().channel.id}>`})]})
  }
}
