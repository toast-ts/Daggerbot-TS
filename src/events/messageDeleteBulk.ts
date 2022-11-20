import Discord, { Message, Snowflake } from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'messageDeleteBulk',
    execute: async(client:TClient, messages:Discord.Collection<Snowflake, Message>)=>{
        const channel = client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel;
        if (!client.config.botSwitches.logs) return;
        let msgArray: Array<string> = [];
        messages.forEach((m)=>{
            msgArray.push(`${m.author?.username}: ${m.content}`);
        });
        const embed = new client.embed().setColor(client.config.embedColorRed).setTimestamp().setTitle(`${messages.size} messages were purged`).setDescription(`\`\`\`${msgArray.reverse().join('\n')}\`\`\``.slice(0,3900)).addFields({name: 'Channel', value: `<#${(messages.first() as Discord.Message).channel.id}>`});
        channel.send({embeds: [embed]})
    }
}