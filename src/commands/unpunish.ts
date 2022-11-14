import Discord from 'discord.js';
import { TClient  } from 'src/client';
export default {
    async run(client: TClient, message: Discord.Message, args: any){
        client.unPunish(client, message, args);
    },
    name: 'unpunish',
    description: 'Remove an active punishment from a user or an entry from their punishment history.',
    usage: ['case id', '?reason'],
    alias: ['unban', 'unmute', 'unwarn'],
    category: 'moderation'
}