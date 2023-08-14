import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  async run(client:TClient, interaction:Discord.BaseInteraction){
    if (!interaction.inGuild() || !interaction.inCachedGuild()) return;
    if (interaction.isChatInputCommand()){
      const commandFile = client.commands.get(interaction.commandName);
      console.log(client.logTime(), `${interaction.user.username} used /${interaction.commandName} ${interaction.options.getSubcommandGroup(false) ?? ''} ${interaction.options.getSubcommand(false) ?? ''} in #${interaction.channel.name}`);
      if (!client.config.botSwitches.commands && !client.config.whitelist.includes(interaction.user.id)) return interaction.reply({content: `I am currently operating in development mode.\nPlease notify <@${client.config.whitelist[0]}> if this is a mistake.`, ephemeral: true});
      if (commandFile){
        try{
          commandFile.command.default.run(client, interaction);
          commandFile.command.default.autocomplete ? commandFile.command.default.autocomplete(interaction) : undefined;
          commandFile.uses ? commandFile.uses++ : commandFile.uses = 1;
        } catch (error){
          console.log(`An error occurred while running command "${interaction.commandName} ${interaction.options.getSubcommand(false) ?? ''}"`, error, error.stack);
          return interaction.reply('An error occurred while executing that command.');
        }
      }
    } else if (interaction.isAutocomplete()){
      const AC = client.commands.get(interaction.commandName);
      try {
        await AC.command.default.autocomplete(client, interaction)
      } catch (error){
        return console.log('An error occurred while running autocomplete:\n', error)
      }
    } else if (interaction.isButton()){
      if (interaction.customId.startsWith('reaction-') && client.config.botSwitches.buttonRoles){
        const RoleID = interaction.customId.replace('reaction-','');
        if (interaction.member.roles.cache.has(RoleID)){
          interaction.member.roles.remove(RoleID, 'Button Role');
          interaction.reply({content: `You have been removed from <@&${RoleID}>`, ephemeral: true})
        } else {
          interaction.member.roles.add(RoleID, 'Button Role');
          interaction.reply({content: `You have been added to <@&${RoleID}>`, ephemeral: true})
        }
      } else console.log(client.logTime(), `Button pressed at ${interaction.message.url}`);
    }
  }
}
