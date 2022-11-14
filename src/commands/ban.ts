import Discord from 'discord.js';
import { TClient  } from 'src/client';
export default {
    async run(client: TClient, message: Discord.Message, args: any){
        if (!message.inGuild() || !message.channel) return;
            client.punish(client, message, args, 'ban');
    },
    name: 'ban',
    description: 'Ban a member from server.',
    usage: ['user mention or id', '?time', '?reason'],
    category: 'moderation'
}