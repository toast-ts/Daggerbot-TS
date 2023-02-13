import Discord from 'discord.js';
import TClient from '../client';
export default {
  async run(client:TClient, interaction:Discord.BaseInteraction){
    if (!interaction.inGuild() || !interaction.inCachedGuild()) return;
    if (interaction.isChatInputCommand()){
      const commandFile = client.commands.get(interaction.commandName);
      console.log(`[${client.moment().format('DD/MM/YY HH:mm:ss')}] ${interaction.user.tag} used /${interaction.commandName} ${interaction.options.getSubcommand(false) ?? ''} in #${interaction.channel.name}`);
      if (!client.config.botSwitches.commands && !client.config.eval.whitelist.includes(interaction.user.id)) return interaction.reply({content: 'Bot is currently being run in development mode.', ephemeral: true});
      if (commandFile){
        try{
            commandFile.default.run(client, interaction);
            commandFile.uses ? commandFile.uses++ : commandFile.uses = 1;
        } catch (error){
            console.log(`An error occured while running command "${commandFile.name}"`, error, error.stack);
            return interaction.reply('An error occured while executing that command.');
        }
      }
    }
  }
}