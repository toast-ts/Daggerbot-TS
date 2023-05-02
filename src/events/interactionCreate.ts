import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  run(client:TClient, interaction:Discord.BaseInteraction){
    if (!interaction.inGuild() || !interaction.inCachedGuild()) return;
    if (interaction.isChatInputCommand()){
      const commandFile = client.commands.get(interaction.commandName);
      console.log(client.logTime(), `${interaction.user.tag} used /${interaction.commandName} ${interaction.options.getSubcommand(false) ?? ''} in #${interaction.channel.name}`);
      if (!client.config.botSwitches.commands && !client.config.whitelist.includes(interaction.user.id)) return interaction.reply({content: 'Bot is currently being run in development mode.', ephemeral: true});
      if (commandFile){
        try{
          commandFile.command.default.run(client, interaction);
          commandFile.uses ? commandFile.uses++ : commandFile.uses = 1;
        } catch (error){
          console.log(`An error occurred while running command "${interaction.commandName} ${interaction.options.getSubcommand(false) ?? ''}"`, error, error.stack);
          return interaction.reply('An error occurred while executing that command.');
        }
      }
    }
  }
}
