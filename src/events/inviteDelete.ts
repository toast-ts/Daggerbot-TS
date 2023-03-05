import Discord from 'discord.js';
import TClient from '../client';
export default {
  run(client:TClient, invite: Discord.Invite){
    client.invites.delete(invite.code)
  }
}
