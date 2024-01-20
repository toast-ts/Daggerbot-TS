import Discord from 'discord.js';
import {exec} from 'node:child_process';
import MessageTool from '../helpers/MessageTool.js';
import UsernameHelper from '../helpers/UsernameHelper.js';
import Formatters from '../helpers/Formatters.js';
import GitHub from '../helpers/GitHub.js';
import TClient from '../client.js';
import util from 'node:util';
import fs, { writeFileSync } from 'node:fs';
export default class Developer {
  static run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>) {
    if (!client.config.whitelist.includes(interaction.user.id)) return MessageTool.youNeedRole(interaction, 'bottech');
    ({
      eval: async()=>{
        fs;
        const code = interaction.options.getString('code') as string;
        let consoleOutput:string = '';

        const deleteEmbedBtn = new Discord.ButtonBuilder().setCustomId('deleteEvalEmbed').setLabel('Delete').setStyle(Discord.ButtonStyle.Danger).setEmoji('🗑️');
        const deleteEmbedRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(deleteEmbedBtn);

        try {
          const consoleLog = console.log;
          console.log = (...args: any[])=>{
            consoleLog(...args);
            consoleOutput += util.formatWithOptions({depth: 3, colors: true}, ...args) + '\n';
          }
          // If using async/await mode, end the code with a return statement for the output to be displayed in the embed.
          const output = await eval(interaction.options.getBoolean('async') ? `(async()=>{${code}})()` : code);
          let outVal = output;
          if (outVal && outVal.includes && outVal.includes(client.token)) outVal = outVal.replace(client.token, '*'.repeat(8));
          const embedFields:Discord.APIEmbedField[] = [
            {name: 'Input', value: `\`\`\`js\n${code.slice(0,1020)}\n\`\`\``},
            {name: 'Output', value: `**\`\`\`${UsernameHelper(outVal === 'string' ? String(outVal) : 'ansi\n'+util.formatWithOptions({depth: 3, colors: true}, '%O', outVal)).slice(0,1012)}\n\`\`\`**`}
          ];
          if (consoleOutput) embedFields.push({name: 'Console', value: `**\`\`\`ansi\n${UsernameHelper(consoleOutput).slice(0,1008)}\n\`\`\`**`});

          const embed = new client.embed().setColor(client.config.embedColor).addFields(embedFields);
          interaction.reply({embeds: [embed], components: [deleteEmbedRow]}).catch(()=>(interaction.channel as Discord.TextChannel).send({embeds: [embed], components: [deleteEmbedRow]}));
        } catch (err) {
          const embed = new client.embed().setColor('#560000').addFields(
            {name: 'Input', value: `\`\`\`js\n${code.slice(0, 1020)}\n\`\`\``},
            {name: 'Output', value: `\`\`\`\n${err}\`\`\``}
          );
          interaction.reply({embeds: [embed], components: [deleteEmbedRow]}).catch(()=>(interaction.channel as Discord.TextChannel).send({embeds: [embed], components: [deleteEmbedRow]})).then(()=>{
            const filter = (x:Discord.Message)=>x.content.includes('console') && x.author.id === interaction.user.id
            const messagecollector = (interaction.channel as Discord.TextChannel).createMessageCollector({filter, max: 1, time: 60000});
            messagecollector.on('collect', collected=>{
              console.log(err)
              collected.reply(`\`\`\`\n${UsernameHelper(err.stack)}\n\`\`\``);
            });
          });
        } finally {
          console.log = console.log;
        }
      },
      update: async()=>{
        const hammondYouIdiot = await interaction.reply({content: 'Pulling...', fetchReply: true});
        const repoData = await GitHub.RemoteRepository();
        const commitStats = {
          total: repoData.stats.total.toLocaleString('en-US'),
          addition: repoData.stats.additions.toLocaleString('en-US'),
          deletion: repoData.stats.deletions.toLocaleString('en-US')
        };
        const msgBody = MessageTool.concatMessage(
          `[Commit pulled](<${repoData.html_url}>)`,
          `Message: **${repoData.commit.message.length === 0 ? '*No commit message*' : repoData.commit.message}**`,
          `Author: **${repoData.commit.author.name}**`,
          'Changes',
          `╰ Additions: **${commitStats.addition}**`,
          `╰ Deletions: **${commitStats.deletion}**`,
          `╰ Total: **${commitStats.total}**`
        );
        exec('git pull', {windowsHide:true}, (err:Error, stdout)=>{
          if (err) hammondYouIdiot.edit(`\`\`\`${UsernameHelper(err.message)}\`\`\``);
          else if (stdout.includes('Already up to date')) hammondYouIdiot.edit('Repository is currently up to date.');
          else hammondYouIdiot.edit('Running `yarn tsc`...').then(()=>exec('yarn tsc', {windowsHide:true}, (err:Error)=>{
            if (err) hammondYouIdiot.edit(`\`\`\`${UsernameHelper(err.message)}\`\`\``);
            else if (interaction.options.getBoolean('restart')) hammondYouIdiot.edit(msgBody + `\nUptime: **${Formatters.timeFormat(process.uptime()*1000, 4, {longNames:true, commas:true})}**`).then(()=>process.exit(0));
            else hammondYouIdiot.edit(msgBody);
          }));
        });
      },
      presence: ()=>{
        function convertType(Type?: number){
          switch (Type) {
            case 0: return 'Playing';
            case 1: return 'Streaming';
            case 2: return 'Listening to';
            case 3: return 'Watching';
            case 4: return 'Custom Status';
            case 5: return 'Competing in';
          }
        };
        const status = interaction.options.getString('status') as Discord.PresenceStatusData | null;
        const type = interaction.options.getInteger('type');
        const name = interaction.options.getString('name');
        const url = interaction.options.getString('url');
        const currentActivities = client.config.botPresence.activities as Discord.ActivitiesOptions[];
        if (status) client.config.botPresence.status = status;
        if (type) currentActivities[0].type = type;
        if (name) currentActivities[0].name = name;
        if (url) currentActivities[0].url = url;
        client.user.setPresence(client.config.botPresence);
        writeFileSync(process.argv[2] ?? 'src/config.json', JSON.stringify(client.config, null, 2));
        interaction.reply(MessageTool.concatMessage(
          'Presence updated:',
          `Status: **${client.config.botPresence.status}**`,
          `Type: **${convertType(currentActivities[0].type)}**`,
          `Name: **${currentActivities[0].name}**`,
          `URL: \`${currentActivities[0].url}\``
        ))
      },
      restart: async()=>{
        const int = await interaction.reply({content: 'Running `yarn tsc`...', fetchReply: true});
        exec('yarn tsc', {windowsHide:true}, (err:Error)=>{
          if (err) int.edit(`\`\`\`${UsernameHelper(err.message)}\`\`\``);
          else int.edit(`Restarting...\nUptime: **${Formatters.timeFormat(process.uptime()*1000, 4, {longNames:true, commas:true})}**`).then(()=>process.exit(0));
        })
      },
      dm: async()=>{
        const member = interaction.options.getMember('member');
        const message = interaction.options.getString('message');
        const int = await interaction.reply({content: '*Sending...*', fetchReply: true});
        client.users.cache.get(member.id).send(`${message}\n╰ ${interaction.member.displayName}`).then(()=>int.edit(`Successfully sent a DM to **${member.user.username}** with the following message:\n\`\`\`${message}\`\`\``)).catch((e:Error)=>int.edit(`\`${e.message}\``))
      },
      modify_rank_msgs: async()=>{
        const member = interaction.options.getMember('member');
        const messages = interaction.options.getInteger('new-message-count');
        const oldData = await client.userLevels.fetchUser(member.id);
        const newData = await client.userLevels.modifyUser(member.id, messages);
        await interaction.reply({embeds:[new client.embed()
          .setColor(client.config.embedColorGreen)
          .setDescription(MessageTool.concatMessage(
            `Successfully modified the message count of **${member.displayName}**`,
            `╰ Old: **${oldData.dataValues.messages.toLocaleString('en-US')}**`,
            `╰ New: **${newData.messages.toLocaleString('en-US')}**`,
            `╰ Difference: **${(newData.messages - oldData.dataValues.messages).toLocaleString('en-US')}**`,
            'Although if you set the number too high or low, it will have a bigger impact on the leaderboard graph.'
          ))
        ]})
      }
    } as any)[interaction.options.getSubcommand()]();
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('dev')
    .setDescription('Developer commands')
    .addSubcommand(x=>x
      .setName('eval')
      .setDescription('Execute the code to the bot')
      .addStringOption(x=>x
        .setName('code')
        .setDescription('Execute your code')
        .setRequired(true))
      .addBooleanOption(x=>x
        .setName('async')
        .setDescription('Asynchronously execute your code')
        .setRequired(false)))
    .addSubcommand(x=>x
      .setName('restart')
      .setDescription('Restart the bot for manual changes/technical difficulties'))
    .addSubcommand(x=>x
      .setName('update')
      .setDescription('Pull from repository and restart')
      .addBooleanOption(x=>x
        .setName('restart')
        .setDescription('Restart the bot after pulling from repository')
        .setRequired(true)
      ))
    .addSubcommand(x=>x
      .setName('presence')
      .setDescription('Update the bot\'s presence')
      .addIntegerOption(x=>x
        .setName('type')
        .setDescription('Set an activity type')
        .addChoices(
          {name: 'Playing', value: Discord.ActivityType.Playing},
          {name: 'Streaming', value: Discord.ActivityType.Streaming},
          {name: 'Listening to', value: Discord.ActivityType.Listening},
          {name: 'Watching', value: Discord.ActivityType.Watching},
          {name: 'Custom Status', value: Discord.ActivityType.Custom},
          {name: 'Competing in', value: Discord.ActivityType.Competing}
        ))
      .addStringOption(x=>x
        .setName('name')
        .setDescription('Set a message for the activity status'))
      .addStringOption(x=>x
        .setName('url')
        .setDescription('Set an url for streaming status'))
      .addStringOption(x=>x
        .setName('status')
        .setDescription('Set a status indicator for the bot')
        .addChoices(
          {name: 'Online', value: Discord.PresenceUpdateStatus.Online},
          {name: 'Idle', value: Discord.PresenceUpdateStatus.Idle},
          {name: 'Do Not Distrub', value: Discord.PresenceUpdateStatus.DoNotDisturb},
          {name: 'Invisible', value: Discord.PresenceUpdateStatus.Offline}
        )))
    .addSubcommand(x=>x
      .setName('dm')
      .setDescription('Reply or send a DM to a member')
      .addUserOption(x=>x
        .setName('member')
        .setDescription('Member to send a DM to')
        .setRequired(true))
      .addStringOption(x=>x
        .setName('message')
        .setDescription('Message to send')
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('modify_rank_msgs')
      .setDescription('Modify the messages count of a member')
      .addUserOption(x=>x
        .setName('member')
        .setDescription('Member to modify the message count of')
        .setRequired(true))
      .addIntegerOption(x=>x
        .setName('new-message-count')
        .setDescription('Replace the message count of the member with this number')
        .setRequired(true)
        .setMinValue(5)
        .setMaxValue(1999999999)))
}
