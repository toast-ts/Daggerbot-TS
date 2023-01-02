import Discord from 'discord.js';
import { TClient } from '../client';
export default {
    async run(client:TClient, messages:Discord.Collection<string, Discord.Message<boolean>>){
        const channel = client.channels.resolve(client.config.mainServer.channels.logs) as Discord.TextChannel;
        if (!client.config.botSwitches.logs) return;
        if ((client.guilds.cache.get('929807948748832798') as Discord.Guild)?.id != client.config.mainServer.id) return;
        const embed = new client.embed().setColor(client.config.embedColorRed).setTimestamp().setTitle(`${messages.size} messages were purged`).setDescription(`\`\`\`${messages.map((msgs)=>`${msgs.member.displayName}: ${msgs.content}`).reverse().join('\n').slice(0,3900)}\`\`\``).addFields({name: 'Channel', value: `<#${(messages.first() as Discord.Message).channel.id}>`});
        channel.send({embeds: [embed]})
    }
}