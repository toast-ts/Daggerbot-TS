import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    const embed = new client.embed().setColor(Math.floor(Math.random()*16777215));
    embed.addFields({name: 'Hex code', value: `#${embed.data.color.toString(16).toUpperCase()}`});
    interaction.reply({embeds: [embed]});
  },
  data: new Discord.SlashCommandBuilder()
    .setName('randomcolor')
    .setDescription('Generate a random hex code')
}