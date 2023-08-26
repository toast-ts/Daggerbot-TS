import Discord from 'discord.js';
import TClient from '../client.js';

export default {
  async run(client:TClient){
    await client.guilds.fetch(client.config.mainServer.id).then(async guild=>{
      await guild.members.fetch();
      setInterval(()=>{
        client.user.setPresence(client.config.botPresence);
        guild.invites.fetch().then(invites=>invites.forEach(inv=>client.invites.set(inv.code, {uses: inv.uses, creator: inv.inviterId, channel: inv.channel.name})))
      },300000)
    })
    if (client.config.botSwitches.registerCommands){
      console.log('Total commands: '+client.registry.length) //Debugging reasons.
      client.config.whitelistedServers.forEach(guildId=>(client.guilds.cache.get(guildId) as Discord.Guild).commands.set(client.registry).catch((e:Error)=>{
        console.log(`Couldn't register slash commands for ${guildId} because`, e.stack);
        (client.channels.resolve(client.config.mainServer.channels.errors) as Discord.TextChannel).send(`Cannot register slash commands for **${client.guilds.cache.get(guildId).name}** (\`${guildId}\`):\n\`\`\`${e.message}\`\`\``)
      }))
    }
    console.log(`${client.user.username} has logged into Discord API`);
    console.log(client.config.botSwitches, client.config.whitelistedServers);
    (client.channels.resolve(client.config.mainServer.channels.bot_status) as Discord.TextChannel).send({content: `${client.user.username} is active`, embeds:[new client.embed().setColor(client.config.embedColor).setDescription(`\`\`\`json\n${Object.entries(client.config.botSwitches).map(x=>`${x[0]}: ${x[1]}`).join('\n')}\`\`\``)]});
    console.timeEnd('Startup')
  }
}
