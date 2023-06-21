import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  run(client:TClient, msg:Discord.Message){
    if (!client.config.botSwitches.logs) return;
    const channel = client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel;
    const disabledChannels = ['548032776830582794', '541677709487505408', '949380187668242483', '1120901022223712296']
    if (msg.guild?.id != client.config.mainServer.id || msg.partial || msg.author.bot || disabledChannels.includes(msg.channelId)) return;
    if (Discord.DiscordAPIError.name === '10008') return console.log(client.logTime(), 'Caught an unexpected error returned by Discord API. (Unknown Message)');
    const embed = new client.embed().setColor(client.config.embedColorRed).setTimestamp().setAuthor({name: `Author: ${msg.author.username} (${msg.author.id})`, iconURL: `${msg.author.displayAvatarURL()}`}).setTitle('Message deleted').setDescription(`<@${msg.author.id}>\n\`${msg.author.id}\``);
    if (msg.content.length != 0) embed.addFields({name: 'Content', value: `\`\`\`\n${msg.content.slice(0,1000)}\n\`\`\``});
    embed.addFields(
      { name: 'Channel', value: `<#${msg.channelId}>` },
      { name: 'Sent at', value: `<t:${Math.round(msg.createdTimestamp/1000)}>\n<t:${Math.round(msg.createdTimestamp/1000)}:R>` }
    )
    const attachments: Array<string> = [];
    msg.attachments.forEach(x=>attachments.push(x.url));
    channel.send({embeds: [embed], files: attachments})
  }
}
