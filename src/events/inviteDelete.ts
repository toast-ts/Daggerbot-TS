import Discord from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'inviteDelete',
    execute: async(client:TClient, invite: Discord.Invite)=>{
        client.invites.delete(invite.code)
    }
}