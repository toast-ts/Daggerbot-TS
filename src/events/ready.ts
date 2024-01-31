import Discord from 'discord.js';
import TClient from '../client.js';
import ansi from 'ansi-colors';
export default class Ready {
  static async run(client:TClient){
    const botSwitches = Object.entries(client.config.botSwitches).map(([k, v])=>`${ansi.yellow(k)}${ansi.black(':')} ${v}`).join('\n').replace(/true/g, ansi.green('true')).replace(/false/g, ansi.red('false'));

    await client.guilds.fetch(client.config.dcServer.id).then(async guild=>{
      const logsArray = [client.config.dcServer.channels.logs, client.config.dcServer.channels.bankick_log];
      for (const channelID of logsArray) {
        const channel = await client.channels.fetch(channelID) as Discord.TextChannel;
        if (channel && channel.type === Discord.ChannelType.GuildText) await channel.messages.fetch({limit: 15});
      }

      await guild.members.fetch();
      setInterval(()=>{
        client.user.setPresence(client.config.botPresence);
        guild.invites.fetch().then(invites=>invites.forEach(inv=>client.invites.set(inv.code, {uses: inv.uses, creator: inv.inviterId, channel: inv.channel.name})))
      }, 300000)
    })
    if (client.config.botSwitches.registerCommands) {
      client.config.whitelistedServers.forEach(guildId=>(client.guilds.cache.get(guildId) as Discord.Guild).commands.set(client.registry).catch((e:Error)=>{
        console.log(`Couldn't register slash commands for ${guildId} because`, e.stack);
        (client.channels.resolve(client.config.dcServer.channels.errors) as Discord.TextChannel).send(`Cannot register slash commands for **${client.guilds.cache.get(guildId).name}** (\`${guildId}\`):\n\`\`\`${e.message}\`\`\``)
      }))
    }
    console.log(`Ready as ${client.user.tag}`);
    console.log(client.config.botSwitches, client.config.whitelistedServers);
    (client.channels.resolve(client.config.dcServer.channels.bot_status) as Discord.TextChannel).send({embeds:[new client.embed().setColor(client.config.embedColor).setDescription(`**\`\`\`ansi\n${botSwitches}\n\`\`\`**`)]});
    console.timeEnd('Startup')
  }
}
