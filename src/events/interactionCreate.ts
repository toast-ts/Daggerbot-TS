import Discord from 'discord.js';
import TClient from '../client.js';
import Logger from '../helpers/Logger.js';
import MessageTool from '../helpers/MessageTool.js';
import CacheServer from '../components/CacheServer.js';
const logPrefix = 'Interaction';
export default class InteractionCreate {
  static async run(client:TClient, interaction:Discord.BaseInteraction){
    if (!interaction.inGuild() || !interaction.inCachedGuild()) return;
    const handlers = {
      isChatInputCommand: this.handleChatInput,
      isAutocomplete: this.handleAutocomplete,
      isButton: this.handleButton
    }

    for (const [intType, handler] of Object.entries(handlers)) {
      if (interaction[intType]()) {
        handler.call(this, client, interaction);
        break;
      }
    }
  }
  static handleChatInput(client:TClient, interaction:Discord.ChatInputCommandInteraction) {
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
  }
  static async handleAutocomplete(client:TClient, interaction:Discord.AutocompleteInteraction) {
    try {
      await client.commands.get(interaction.commandName).command.autocomplete(client, interaction);
    } catch (error){
      return console.log('An error occurred while running autocomplete:\n', error)
    }
  }
  static async handleButton(client:TClient, interaction:Discord.ButtonInteraction<'cached'>) {
    const time = Date.now();
    if (interaction.customId.startsWith('reaction-') && client.config.botSwitches.buttonRoles){
      const RoleID = interaction.customId.replace('reaction-','');

      let key = `${interaction.user.id}:role_room`;
      const isRatelimited = await CacheServer.get(key, false);
      const timeDiff = time - isRatelimited;
      if (timeDiff < 5000) return interaction.reply({content: 'You are on **__cooldown__**, please avoid spam-clicking next time.\n\n*This system is put in place due to selfbots.. I\'m sorry!*', ephemeral: true});

      const MFFarm1 = '1149139369433776269';
      const MFFarm2 = '1149139583729160325';

      if (interaction.member.roles.cache.has(RoleID)) interaction.member.roles.remove(RoleID, 'Button Role').then(()=>interaction.reply({content: `You have been removed from <@&${RoleID}>`, ephemeral: true}));
      else interaction.member.roles.add(RoleID, 'Button Role').then(async()=>{
        this.roleConflictHandler(interaction, MFFarm1, MFFarm2, RoleID);
        await interaction.reply({content: `You have been added to <@&${RoleID}>`, ephemeral: true, fetchReply: true});
        CacheServer.set(key, time, false).then(()=>CacheServer.expiry(key, 10));
      });
    } else if (interaction.customId.includes('deleteEvalEmbed')) {
      if (!client.config.whitelist.includes(interaction.user.id)) return interaction.reply({content: 'You are not whitelisted, therefore you cannot delete this message.', ephemeral: true});
      interaction.message.delete();
      Logger.console('log', logPrefix, `Eval embed has been deleted in #${interaction.message.channel.name} by ${interaction.member.displayName}`);
    } else Logger.console('log', logPrefix, `Button has been pressed at ${interaction.message.url}`);
  }
  static roleConflictHandler(interaction:Discord.ButtonInteraction<'cached'>, role1:Discord.Snowflake, role2:Discord.Snowflake, newRole:Discord.Snowflake) {
    if (interaction.member.roles.cache.has(role1) && interaction.member.roles.cache.has(role2)) {
      const roleToRemove = newRole === role1 ? role2 : role1;
      interaction.member.roles.remove(roleToRemove, 'Cannot have both roles! - Button Role').then(()=>interaction.editReply({
        content: `You cannot have both farm roles, so you have been removed from ${MessageTool.formatMention(roleToRemove, 'role')} and added to ${MessageTool.formatMention(newRole, 'role')}`}
      ));
    }
  }
}
