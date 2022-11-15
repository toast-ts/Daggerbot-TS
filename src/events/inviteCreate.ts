import Discord from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'inviteCreate',
    execute: async(client:TClient, invite: Discord.Invite)=>{
        if (!invite.guild) return;
        const newInvites = await (invite.guild as Discord.Guild).invites.fetch();
        newInvites.forEach(inv=>client.invites.set(inv.code,{uses: inv.code, creator: inv.inviterId}))
    }
}