import Discord from 'discord.js';
import TClient from '../client.js';
import {writeFileSync, existsSync, mkdirSync} from 'node:fs';
import MessageTool from '../helpers/MessageTool.js';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (client.config.mainServer.id === interaction.guildId) {
      if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmod) && !interaction.member.roles.cache.has(client.config.mainServer.roles.bottech)) return MessageTool.youNeedRole(interaction, 'mpmod');
    }
    const channelId = '1084864116776251463'; // #mp-announcements
    ({
      start: async()=>{
        const map_names = interaction.options.getString('map_names', true).split('|');
        if (map_names.length > 10) return interaction.reply('You can only have up to 10 maps in a poll!');

        const msg = await (interaction.guild.channels.cache.get(channelId) as Discord.TextChannel).send({content: MessageTool.formatMention(client.config.mainServer.roles.mpplayer, 'role'), embeds: [
        new client.embed()
          .setColor(client.config.embedColor)
          .setTitle('Vote for next map!')
          .setDescription(map_names.map((map,i)=>`${i+1}. **${map}**`).join('\n'))
          .setFooter({text: `Poll started by ${interaction.user.tag}`, iconURL: interaction.member.displayAvatarURL({extension: 'webp', size: 1024})})
        ], allowedMentions: {parse: ['roles']}});
        await interaction.reply(`Successfully created a poll in <#${channelId}>`)

        const numbers = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
        for (let i = 0; i < map_names.length; i++) await msg.react(numbers[i])
      },
      end: async()=>{
        const msg = await (interaction.guild.channels.cache.get(channelId) as Discord.TextChannel).messages.fetch(interaction.options.getString('message_id', true));
        if (!msg) return interaction.reply('Message not found, please make sure you have the correct message ID.');

        if (msg.embeds[0].title !== 'Vote for next map!') return interaction.reply('This message is not a poll!');
        if (msg.embeds[0].footer?.text?.startsWith('Poll ended by')) return interaction.reply('This poll has already ended!');
        if (msg.reactions.cache.size < 2) return interaction.reply('This poll has not been voted on yet!');

        if (!existsSync('src/database/polls')) mkdirSync('src/database/polls');
        writeFileSync(`src/database/polls/pollResults-${msg.id}.json`, JSON.stringify({
          map_names: msg.embeds[0].description.split('\n').map(x=>x.slice(3)),
          votes: msg.reactions.cache.map(x=>x.count)
        }, null, 2));
        (client.channels.cache.get('516344221452599306') as Discord.TextChannel).send({files: [`src/database/polls/pollResults-${msg.id}.json`]});

        msg.edit({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Voting has ended!').setDescription('The next map will be '+msg.embeds[0].description.split('\n')[msg.reactions.cache.map(x=>x.count).indexOf(Math.max(...msg.reactions.cache.map(x=>x.count)))].slice(3)).setFooter({text: `Poll ended by ${interaction.user.tag}`, iconURL: interaction.member.displayAvatarURL({extension: 'webp', size: 1024})})]});
        await interaction.reply(`Successfully ended the [poll](<https://discord.com/channels/${interaction.guildId}/${channelId}/${msg.id}>) in <#${channelId}>`)
      }
    })[interaction.options.getSubcommand()]();
  },
  data: new Discord.SlashCommandBuilder()
    .setName('poll')
    .setDescription('Poll system for FSMP server')
    .addSubcommand(x=>x
      .setName('start')
      .setDescription('Start a poll')
      .addStringOption(x=>x
        .setName('map_names')
        .setDescription('Map names separated by |\'s, up to 10 maps')
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('end')
      .setDescription('End a poll')
      .addStringOption(x=>x
        .setName('message_id')
        .setDescription('Message ID of the poll')
        .setRequired(true)))
}
