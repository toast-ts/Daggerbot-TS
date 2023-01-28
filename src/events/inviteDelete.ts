import Discord from 'discord.js';
import TClient from '../client';
export default {
    async run(client:TClient, invite: Discord.Invite){
        client.invites.delete(invite.code)
    }
}