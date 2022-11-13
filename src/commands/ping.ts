import { TClient } from "src/client";
import Discord from 'discord.js';
export default {
    async run(client: TClient, message: Discord.Message, args: any){
        const msg = await message.reply(`Pinging...`)
        const time = msg.createdTimestamp - message.createdTimestamp;
        msg.edit(`Websocket: \`${client.ws.ping}\`ms\nBot: \`${time}\``)
    },
    name: 'ping',
    description: 'Check bot\'s latency',
    category: 'bot'
}