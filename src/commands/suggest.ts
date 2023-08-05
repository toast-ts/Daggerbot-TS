import Discord from 'discord.js';
import TClient,{WClient} from '../client.js';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    const replyInDM = interaction.options.getString('message');
    const suggestionIDReply = interaction.options.getString('id');
    const suggestionID = (Math.random() + 1).toString(36).substring(5);
    const userid = (await client.suggestion._content.findById(suggestionIDReply))?.user._id;
    const theirIdea = (await client.suggestion._content.findById(suggestionIDReply))?.idea;
    const timeFormatting = client.moment().format('DD/MM/YY h:mm A');
    const stateChanged = 'Suggestion state has been successfully updated and DM is sent.';
    const dmFail = (client.channels.resolve('1040018521746325586') as Discord.TextChannel).send(`Failed to send a DM to <@${userid}>, they possibly have it turned off or blocked me.\nSuggestion ID: **${suggestionIDReply}**`);
    ({
      your: async()=>{
        const wclient = new WClient;
        const suggestionText = interaction.options.getString('suggestion');
        const suggestionImage = interaction.options.getAttachment('image');
        const notifEmbed = new client.embed()
          .setColor(client.config.embedColor)
          .setTitle(`Suggestion ID: ${suggestionID}`)
          .setAuthor({name: interaction.user.username, iconURL: interaction.user.avatarURL({size: 256})})
          .setFooter({text: `Timestamp: ${timeFormatting}`})
          .setDescription([
            '> **Suggestion:**',
            suggestionText
          ].join('\n'));
        if (suggestionImage) notifEmbed.setImage(suggestionImage.url);
        wclient.send({embeds: [notifEmbed], username: `${client.user.username} Notification`, avatarURL: client.user.avatarURL({size: 256})}
        ).catch(e=>{
          console.log(e.message);
          interaction.reply({content: 'Failed to send suggestion, try again later.', ephemeral: true})
        })
        await client.suggestion._content.create({_id: suggestionID, idea: suggestionText, user: {_id: interaction.user.id, tag: interaction.user.username}, state: 'Pending'});
        interaction.reply({content: `Suggestion sent, here is your suggestion ID to take note of it: \`${suggestionID}\``, ephemeral: true})
      },
      approve: async()=>{
        if (client.config.mainServer.id === interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.mainServer.roles.bottech)) return client.youNeedRole(interaction, 'bottech');
        }
        if ((await client.suggestion._content.findById(suggestionIDReply)).state === 'Rejected') return interaction.reply({content: 'This suggestion\'s state is locked and cannot be modified.', ephemeral: true});
        (await client.users.fetch(userid)).send({embeds: [new client.embed()
          .setColor(client.config.embedColorGreen)
          .setAuthor({name: interaction.user.username, iconURL: interaction.user.avatarURL({size: 256})})
          .setTitle('Your suggestion has been approved.')
          .setDescription(`> **Your suggestion:**\n${theirIdea}\n> **Their message:**\n${replyInDM.length === null ? '*No message from them.*' : replyInDM}`)
          .setFooter({text: `Timestamp: ${timeFormatting} | Suggestion ID: ${suggestionIDReply}`})
        ]}).catch(()=>dmFail);
        await client.suggestion._content.findByIdAndUpdate(suggestionIDReply, {state: 'Approved'});
        return interaction.reply({embeds:[new client.embed().setColor(client.config.embedColorGreen).setTitle(`Suggestion approved | ${suggestionIDReply}`).setDescription(stateChanged)]});
      },
      reject: async()=>{
        if (client.config.mainServer.id === interaction.guildId) {
          if (!interaction.member.roles.cache.has(client.config.mainServer.roles.bottech)) return client.youNeedRole(interaction, 'bottech');
        }
        if ((await client.suggestion._content.findById(suggestionIDReply)).state === 'Approved') return interaction.reply({content: 'This suggestion\'s state is locked and cannot be modified.', ephemeral: true});
        (await client.users.fetch(userid)).send({embeds: [new client.embed()
          .setColor(client.config.embedColorRed)
          .setAuthor({name: interaction.user.username, iconURL: interaction.user.avatarURL({size: 256})})
          .setTitle('Your suggestion has been rejected.')
          .setDescription(`> **Your suggestion:**\n${theirIdea}\n> **Their message:**\n${replyInDM.length === null ? '*No message from them.*' : replyInDM}`)
          .setFooter({text: `Timestamp: ${timeFormatting} | Suggestion ID: ${suggestionIDReply}`})
        ]}).catch(()=>dmFail);
        await client.suggestion._content.findByIdAndUpdate(suggestionIDReply, {state: 'Rejected'});
        return interaction.reply({embeds:[new client.embed().setColor(client.config.embedColorRed).setTitle(`Suggestion rejected | ${suggestionIDReply}`).setDescription(stateChanged)]});
      }
    } as any)[interaction.options.getSubcommand()]();
  },
  data: new Discord.SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Want to suggest ideas/thoughts to bot techs? Suggest it here')
    .addSubcommand(x=>x
      .setName('your')
      .setDescription('What do you want to suggest?')
      .addStringOption(x=>x
        .setName('suggestion')
        .setDescription('Suggest something to bot techs. (You will be DM\'d by bot if your idea was approved/rejected)')
        .setMaxLength(1024)
        .setRequired(true))
      .addAttachmentOption(x=>x
        .setName('image')
        .setDescription('If your idea seems complicated or prefer to show what your idea may look like then attach the image.')))
    .addSubcommand(x=>x
      .setName('approve')
      .setDescription('[Bot Tech] Approve the suggestion sent by the user')
      .addStringOption(x=>x
        .setName('id')
        .setDescription('User\'s suggestion ID')
        .setRequired(true))
      .addStringOption(x=>x
        .setName('message')
        .setDescription('(Optional) Include a message with your approval')
        .setMaxLength(256)))
    .addSubcommand(x=>x
      .setName('reject')
      .setDescription('[Bot Tech] Reject the suggestion sent by the user')
      .addStringOption(x=>x
        .setName('id')
        .setDescription('User\'s suggestion ID')
        .setRequired(true))
      .addStringOption(x=>x
        .setName('message')
        .setDescription('(Optional) Include a message with your rejection')
        .setMaxLength(256)))
}