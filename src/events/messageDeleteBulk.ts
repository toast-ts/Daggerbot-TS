import Discord, { Message, Snowflake } from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'messageDeleteBulk',
    execute: async(client:TClient, messages:Discord.Collection<Snowflake, Message>)=>{
        const channel = client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel;
        if (!client.config.botSwitches.logs) return;
        let text = '';
        messages.forEach((m)=>{
            text += `${m.author.username}: ${m.content}\n`;
        });
        const embed = new client.embed().setColor(client.config.embedColorRed).setTimestamp().setTitle(`${messages.size} messages were purged`).setDescription(`\`\`\`${text}\`\`\``.slice(0,3900)).addFields({name: 'Channel', value: `<#${(messages.first() as Discord.Message).channel.id}>`});
        channel.send({embeds: [embed]})
    }
}