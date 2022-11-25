import Discord from 'discord.js';
import { TClient } from '../client';
export default {
    name: 'interactionCreate',
    execute: async(client:TClient, interaction:Discord.ChatInputCommandInteraction)=>{
        if (!interaction.inGuild() || !interaction.inCachedGuild() || !interaction.command) return;
        if (interaction.isCommand()){
            const commandFile = client.commands.get(interaction.commandName);
            console.log(`[${client.moment().format('DD/MM/YY HH:mm:ss')}] ${interaction.user.tag} used /${interaction.commandName} in #${interaction.channel.name}`);
            if (!client.config.botSwitches.commands && !client.config.eval.whitelist.includes(interaction.user.id)) return interaction.reply({content: 'Commands are currently disabled.', ephemeral: true});
            if (commandFile){
                if (commandFile.disabled) return interaction.reply({content: 'This command is currently disabled.', ephemeral: true});
                try{
                    commandFile.default.run(client, interaction);
                    commandFile.uses ? commandFile.uses++ : commandFile.uses = 1;
                } catch (error:any){
                    console.log(`An error occured while running command "${commandFile.name}"`, error, error.stack);
                    return interaction.reply('An error occured while executing that command.');
                }
            }
        }
    }
}