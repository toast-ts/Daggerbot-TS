import Discord from 'discord.js';
import TClient from '../client.js';

export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (client.config.mainServer.id === interaction.guildId) {
      if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager) && !interaction.member.roles.cache.has(client.config.mainServer.roles.bottech) && !interaction.member.roles.cache.has(client.config.mainServer.roles.admin)) return client.youNeedRole(interaction, 'mpmanager');
    }
    const maintenanceMessage = interaction.options.getString('message');
    const activePlayersChannel = '739084625862852715';
    const channel = (client.channels.cache.get(activePlayersChannel) as Discord.TextChannel);
    const embed = new client.embed().setColor(client.config.embedColor).setAuthor({name: interaction.member.displayName, iconURL: interaction.member.displayAvatarURL({size:1024})}).setTimestamp();
    console.log(channel.permissionsFor(interaction.guildId).has('SendMessages'));
    if (channel.permissionsFor(interaction.guildId).has('SendMessages')) {
      channel.permissionOverwrites.edit(interaction.guildId, {SendMessages: false}, {type: 0, reason: `Locked by ${interaction.member.displayName}`});
      channel.send({embeds: [embed.setTitle('🔒 Channel locked').setDescription(`**Reason:**\n${maintenanceMessage}`)]});
      interaction.reply({content: `<#${activePlayersChannel}> has been locked!`, ephemeral: true});
    } else if (!channel.permissionsFor(interaction.guildId).has('SendMessages')) {
      channel.permissionOverwrites.edit(interaction.guildId, {SendMessages: true}, {type: 0, reason: `Unlocked by ${interaction.member.displayName}`});
      channel.send({embeds: [embed.setTitle('🔓 Channel unlocked').setDescription(`**Reason:**\n${maintenanceMessage}`)]});
      interaction.reply({content: `<#${activePlayersChannel}> has been unlocked!`, ephemeral: true});
    }
  },
  data: new Discord.SlashCommandBuilder()
  .setName('mp-maintenance') // Just a workaround because I am too fucking tired of issues with it, so it gets to be in dedicated file for now. (Also sorry for the swear word, I am just stressed right now.)
  .setDescription('Toggle maintenance mode for #mp-active-players')
  .addStringOption(x=>x
   .setName('message')
   .setDescription('The message to display in the channel')
   .setRequired(true))
}
