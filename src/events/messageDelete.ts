import Discord from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'messageDelete',
    execute: async(client:TClient, msg:Discord.Message)=>{
        if (!client.config.botSwitches.logs) return;
        const channel = client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel;
        if (msg.partial) return;
        if (msg.author.bot) return;
        const embed = new client.embed().setColor(client.config.embedColorRed).setTimestamp().setAuthor({name: `Author: ${msg.author.tag} (${msg.author.id})`, iconURL: `${msg.author.displayAvatarURL()}`}).setTitle('Message deleted').setDescription(`<@${msg.author.id}>\nContent:\n\`\`\`\n${msg?.content}\n\`\`\`\nChannel: <#${msg.channelId}>`)
        let image;
        if (msg.attachments?.first()?.width && ['png', 'jpeg', 'jpg', 'gif', 'webp'].some(x=>((msg.attachments.first() as Discord.Attachment).name as string).endsWith(x))) {
            image = msg.attachments?.first().proxyURL
            embed.setImage(image)
        }
        channel.send({embeds: [embed]})
    }
}
