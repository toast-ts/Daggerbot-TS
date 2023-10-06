import Discord from 'discord.js';
import TClient from '../client.js';
import ansi from 'ansi-colors';
export default {
  async run(client:TClient){
    const botSwitches = Object.entries(client.config.botSwitches).map(([k, v])=>`${ansi.yellow(k)}${ansi.black(':')} ${v}`).join('\n').replace(/true/g, ansi.green('true')).replace(/false/g, ansi.red('false'));

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
    (client.channels.resolve(client.config.mainServer.channels.bot_status) as Discord.TextChannel).send({content: `**${client.user.username}** is active`, embeds:[new client.embed().setColor(client.config.embedColor).setDescription(`**\`\`\`ansi\n${botSwitches}\n\`\`\`**`)]});
    console.timeEnd('Startup')
  }
}
