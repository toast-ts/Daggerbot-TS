import Discord from 'discord.js';
import TClient from '../client.js';
import Logger from '../helpers/Logger.js';
export default class InteractionCreate {
  static async run(client:TClient, interaction:Discord.BaseInteraction){
    if (!interaction.inGuild() || !interaction.inCachedGuild()) return;
    const logPrefix = 'Interaction';

    if (interaction.isChatInputCommand()){
      const commandFile = client.commands.get(interaction.commandName);
      Logger.console('log', logPrefix, `${interaction.user.username} used /${interaction.commandName} ${interaction.options.getSubcommandGroup(false) ?? ''} ${interaction.options.getSubcommand(false) ?? ''} in #${interaction.channel.name}`.replace(/\s\s+/g, ' ').trim());
      if (!client.config.botSwitches.commands && !client.config.whitelist.includes(interaction.user.id)) return interaction.reply({content: `I am currently operating in development mode.\nPlease notify <@${client.config.whitelist[0]}> if this is a mistake.`, ephemeral: true});
      if (commandFile){
        try{
          commandFile.command.run(client, interaction);
          commandFile.command.autocomplete ? commandFile.command.autocomplete(interaction) : undefined;
          commandFile.uses ? commandFile.uses++ : commandFile.uses = 1;
        } catch (error){
          console.log(`An error occurred while running command "${interaction.commandName} ${interaction.options.getSubcommandGroup(false) ?? ''} ${interaction.options.getSubcommand(false) ?? ''}"`, error, error.stack);
          return interaction.reply('An error occurred while running that command.');
        }
      }
    } else if (interaction.isAutocomplete()){
      try {
        await client.commands.get(interaction.commandName).command.autocomplete(client, interaction);
      } catch (error){
        return console.log('An error occurred while running autocomplete:\n', error)
      }
    } else if (interaction.isButton()){
      if (interaction.customId.startsWith('reaction-') && client.config.botSwitches.buttonRoles){
        const RoleID = interaction.customId.replace('reaction-','');

        let roleConflictMsg = 'Cannot have both roles! - Button Role';
        const MFFarm1 = '1149139369433776269';
        const MFFarm2 = '1149139583729160325';
        if (interaction.member.roles.cache.has(MFFarm1) && RoleID === MFFarm2) interaction.member.roles.remove(MFFarm1, roleConflictMsg);
        else if (interaction.member.roles.cache.has(MFFarm2) && RoleID === MFFarm1) interaction.member.roles.remove(MFFarm2, roleConflictMsg);

        if (interaction.member.roles.cache.has(RoleID)) interaction.member.roles.remove(RoleID, 'Button Role').then(()=>interaction.reply({content: `You have been removed from <@&${RoleID}>`, ephemeral: true}));
        else interaction.member.roles.add(RoleID, 'Button Role').then(()=>interaction.reply({content: `You have been added to <@&${RoleID}>`, ephemeral: true}));
      } else if (interaction.customId.includes('deleteEvalEmbed')) {
        if (!client.config.whitelist.includes(interaction.user.id)) return interaction.reply({content: 'You are not whitelisted, therefore you cannot delete this message.', ephemeral: true});
        interaction.message.delete();
        Logger.console('log', logPrefix, `Eval embed has been deleted in #${interaction.message.channel.name} by ${interaction.member.displayName}`);
      } else Logger.console('log', logPrefix, `Button has been pressed at ${interaction.message.url}`);
    }
  }
}
