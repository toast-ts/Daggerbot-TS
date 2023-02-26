import Discord from 'discord.js';
import TClient from '../client';
export default {
    async run(client:TClient, messages:Discord.Collection<string, Discord.Message<boolean>>){
        if (!client.config.botSwitches.logs) return;
        if (client.config.mainServer.id != '468835415093411861') return;
        const channel = client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel;
        channel.send({embeds: [new client.embed().setColor(client.config.embedColorRed).setTimestamp().setTitle(`${messages.size} messages were purged`).setDescription(`\`\`\`${messages.map((msgs)=>`${msgs.member?.displayName}: ${msgs.content}`).reverse().join('\n').slice(0,3900)}\`\`\``).addFields({name: 'Channel', value: `<#${messages.first().channel.id}>`})]})
    }
}