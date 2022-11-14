import Discord from 'discord.js';
import { TClient  } from 'src/client';
export default {
    async run(client: TClient, message: Discord.Message, args: any){
        if (!message.inGuild() || !message.channel) return;
            client.punish(client, message, args, 'warn');
    },
    name: 'kick',
    description: 'Warn a member.',
    usage: ['user mention or id', '?reason'],
    category: 'moderation'
}