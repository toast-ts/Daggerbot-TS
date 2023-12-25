import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
export default class Purge {
  static async run(_client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!MessageTool.isStaff(interaction.member)) return MessageTool.youNeedRole(interaction, 'dcmod');
    const amount = interaction.options.getInteger('amount') as number;
    if (amount > 100) return interaction.reply({content: 'Discord API limits purging up to 100 messages.', ephemeral: true})
    const user = interaction.options.getUser('user');
    let messagesArray:string[] = [];

    if (user){
      (interaction.channel as Discord.TextChannel).messages.fetch({limit: amount}).then(msgs=>{
        const msgList = msgs.filter(x=>x.author.id === user.id);
        (interaction.channel as Discord.TextChannel).bulkDelete(msgList);
      })
    } else {
      (interaction.channel as Discord.TextChannel).messages.fetch({limit: amount}).then(async messages=>{
        messages.forEach(message=>messagesArray.push(message.id));
        await (interaction.channel as Discord.TextChannel).bulkDelete(messagesArray);
      })
    }
    await interaction.reply({content: `Successfully purged ${amount} messages.`, ephemeral: true})
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('purge')
    .setDescription('Purge the amount of messages in this channel')
    .addIntegerOption(x=>x
      .setName('amount')
      .setDescription('Amount of messages to be obliterated')
      .setRequired(true))
    .addUserOption(x=>x
      .setName('user')
      .setDescription('Which user to have their messages obliterated?'))
}
