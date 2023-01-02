import Discord from 'discord.js';
import { TClient } from '../client';
export default {
    async run(client:TClient, invite: Discord.Invite){
        if (!invite.guild) return;
        const newInvites = await (invite.guild as Discord.Guild).invites.fetch();
        newInvites.forEach(inv=>client.invites.set(inv.code,{uses: inv.code, creator: inv.inviterId}))
    }
}