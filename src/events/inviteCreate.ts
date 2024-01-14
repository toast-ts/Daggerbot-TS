import Discord from 'discord.js';
import TClient from '../client.js';
export default class InviteCreate {
  static async run(client:TClient, invite:Discord.Invite){
    if (!invite.guild) return;
    (await (invite.guild as Discord.Guild).invites.fetch()).forEach(inv=>client.invites.set(inv.code,{uses: inv.uses, creator: inv.inviterId, channel: inv.channel.name}))
  }
}
