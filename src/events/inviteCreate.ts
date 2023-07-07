import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  async run(client:TClient, invite: Discord.Invite){
    if (!invite.guild) return;
    (await (invite.guild as Discord.Guild).invites.fetch()).forEach(inv=>client.invites.set(inv.code,{uses: inv.code, creator: inv.inviterId, channel: inv.channel.name}))
  }
}
