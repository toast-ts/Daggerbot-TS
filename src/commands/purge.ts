import Discord,{SlashCommandBuilder} from 'discord.js';
import TClient from '../client.js';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!client.isStaff(interaction.member)) return client.youNeedRole(interaction, 'dcmod');
    const amount = interaction.options.getInteger('amount') as number;
    if (amount > 100) return interaction.reply({content: 'Discord API limits purging up to 100 messages.', ephemeral: true})
    const user = interaction.options.getUser('user');

    let messagesArray: Array<string> = [];

    if (user){
      (interaction.channel as Discord.TextChannel).messages.fetch({limit: amount}).then(msgs=>{
        const msgList = msgs.filter(x=>x.author.id == user.id);
        (interaction.channel as Discord.TextChannel).bulkDelete(msgList);
      })
    } else {
      (interaction.channel as Discord.TextChannel).messages.fetch({limit: amount}).then(async messages=>{
        messages.forEach(message=>messagesArray.push(message.id));
        await (interaction.channel as Discord.TextChannel).bulkDelete(messagesArray);
      })
    }
    await interaction.reply({content: `Successfully purged ${amount} messages.`, ephemeral: true})
  },
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Purge the amount of messages in this channel')
    .addIntegerOption(opt=>opt
      .setName('amount')
      .setDescription('Amount of messages to be obliterated')
      .setRequired(true))
    .addUserOption(opt=>opt
      .setName('user')
      .setDescription('Which user to have their messages obliterated?'))
}