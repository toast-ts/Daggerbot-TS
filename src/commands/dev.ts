import Discord from 'discord.js';
import {Octokit} from '@octokit/rest';
import {createTokenAuth} from '@octokit/auth-token';
import {exec} from 'node:child_process';
import MessageTool from '../helpers/MessageTool.js';
import UsernameHelper from '../helpers/UsernameHelper.js';
import FormatTime from '../helpers/FormatTime.js';
import TSClient from '../helpers/TSClient.js';
import TClient from '../client.js';
import fs from 'node:fs';
import util from 'node:util';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>) {
    if (!client.config.whitelist.includes(interaction.user.id)) return MessageTool.youNeedRole(interaction, 'bottech');
    ({
      eval: async()=>{
        if (!client.config.eval) return interaction.reply({content: 'Eval is currently disabled.', ephemeral: true});
        const code = interaction.options.getString('code') as string;
        let consoleOutput:string = '';

        const deleteEmbedBtn = new Discord.ButtonBuilder().setCustomId('deleteEmbed').setLabel('Delete').setStyle(Discord.ButtonStyle.Danger).setEmoji('🗑️');
        const deleteEmbedRow = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(deleteEmbedBtn);
        const deleteEmbedCollector = interaction.channel.createMessageComponentCollector({componentType: Discord.ComponentType.Button});
        deleteEmbedCollector.on('collect', async i=>{
          if (i.customId === 'deleteEmbed') deleteEmbedCollector.stop();
        });

        try {
          const consoleLog = console.log;
          console.log = (...args: any[])=>{
            consoleLog(...args);
            consoleOutput += util.formatWithOptions({depth: 2, colors: true}, ...args) + '\n';
          }

          const output = await eval(interaction.options.getBoolean('async') ? `(async()=>{${code}})()` : code);
          let outVal = output !== undefined ? output : 'No output';
          if (outVal && outVal.includes && outVal.includes(client.token)) outVal = outVal.replace(client.token, '*'.repeat(8));
          const embedFields:Discord.APIEmbedField[] = [
            {name: 'Input', value: `\`\`\`js\n${code.slice(0,1020)}\n\`\`\``},
            {name: 'Output', value: `**\`\`\`${UsernameHelper.stripName(outVal === 'string' ? String(outVal) : 'ansi\n'+util.formatWithOptions({depth: 2, colors: true}, '%O', outVal)).slice(0,1012)}\n\`\`\`**`}
          ];
          if (consoleOutput) embedFields.push({name: 'Console', value: `**\`\`\`ansi\n${UsernameHelper.stripName(consoleOutput).slice(0,1008)}\n\`\`\`**`});
          if (typeof output === 'object') {
            const embed = new client.embed().setColor(client.config.embedColor).addFields(embedFields);
            interaction.reply({embeds: [embed], components: [deleteEmbedRow]}).catch(()=>(interaction.channel as Discord.TextChannel).send({embeds: [embed], components: [deleteEmbedRow]}));
          } else {
            const embed = new client.embed().setColor(client.config.embedColor).addFields(embedFields);
            interaction.reply({embeds: [embed], components: [deleteEmbedRow]}).catch(()=>(interaction.channel as Discord.TextChannel).send({embeds: [embed], components: [deleteEmbedRow]}));
          }
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
              collected.reply(`\`\`\`\n${UsernameHelper.stripName(err.stack)}\n\`\`\``);
            });
          });
        } finally {
          console.log = console.log;
        }
      },
      update: async()=>{
        const SummonAuthentication = createTokenAuth((await TSClient.Token()).octokit);
        const {token} = await SummonAuthentication();
        var githubRepo = {owner: 'AnxietyisReal', repo: 'Daggerbot-TS', ref: 'HEAD'};
        const hammond = await interaction.reply({content: 'Pulling from repository...', fetchReply: true});
        const octokit = new Octokit({auth: token, timeZone: 'Australia/NSW', userAgent: 'Daggerbot-TS'});
        const github = {
          fetchCommit: {
            msg: await octokit.repos.getCommit(githubRepo).then(x=>x.data.commit.message).catch((err:Error)=>err.message),
            author: await octokit.repos.getCommit(githubRepo).then(x=>x.data.commit.author.name).catch((err:Error)=>err.message),
            url: await octokit.repos.getCommit(githubRepo).then(x=>x.data.html_url).catch((err:Error)=>err.message)
          },
          fetchChanges: {
            total: await octokit.repos.getCommit(githubRepo).then(x=>x.data.stats.total.toLocaleString('en-US')).catch((err:Error)=>err.message),
            addition: await octokit.repos.getCommit(githubRepo).then(x=>x.data.stats.additions.toLocaleString('en-US')).catch((err:Error)=>err.message),
            deletion: await octokit.repos.getCommit(githubRepo).then(x=>x.data.stats.deletions.toLocaleString('en-US')).catch((err:Error)=>err.message)
          }
        };
        exec('git pull',{windowsHide:true},(err:Error,stdout)=>{
          if (err) hammond.edit(`\`\`\`${UsernameHelper.stripName(err.message)}\`\`\``)
          else if (stdout.includes('Already up to date')) hammond.edit('I am already up to date with the upstream repository.')
          else hammond.edit('Compiling TypeScript files...').then(()=>exec('yarn tsc', {windowsHide:true}, (err:Error)=>{
            if (err) hammond.edit(`\`\`\`${UsernameHelper.stripName(err.message)}\`\`\``)
            if (interaction.options.getBoolean('restart')) hammond.edit(`[Commit:](<${github.fetchCommit.url}>) **${github.fetchCommit.msg.length === 0 ? 'No commit message' : github.fetchCommit.msg}**\nCommit author: **${github.fetchCommit.author}**\n\n__Commit changes__\nTotal: **${github.fetchChanges.total}**\nAdditions: **${github.fetchChanges.addition}**\nDeletions: **${github.fetchChanges.deletion}**\n\nSuccessfully compiled TypeScript files into JavaScript!\nUptime before restarting: **${FormatTime(client.uptime, 3, {commas: true, longNames: true})}**`).then(()=>exec('pm2 restart Daggerbot', {windowsHide:true}));
            else hammond.edit(`[Commit:](<${github.fetchCommit.url}>) **${github.fetchCommit.msg.length === 0 ? 'No commit message' : github.fetchCommit.msg}**\nCommit author: **${github.fetchCommit.author}**\n\n__Commit changes__\nTotal: **${github.fetchChanges.total}**\nAdditions: **${github.fetchChanges.addition}**\nDeletions: **${github.fetchChanges.deletion}**\n\nSuccessfully compiled TypeScript files into JavaScript!`)
          }))
        })
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
        interaction.reply(MessageTool.concatMessage(
          'Presence updated:',
          `Status: **${client.config.botPresence.status}**`,
          `Type: **${convertType(currentActivities[0].type)}**`,
          `Name: **${currentActivities[0].name}**`,
          `URL: \`${currentActivities[0].url}\``
        ))
      },
      statsgraph: ()=>{
        client.statsGraph = -(interaction.options.getInteger('number', true));
        interaction.reply(`Successfully set to \`${client.statsGraph}\`\n*Total data points: **${JSON.parse(fs.readFileSync(`src/database/${interaction.options.getString('server')}PlayerData.json`, {encoding: 'utf8'})).length.toLocaleString()}***`)
      },
      logs: ()=>(client.channels.resolve(client.config.mainServer.channels.console) as Discord.TextChannel).send({content: `Uploaded the current console dump as of <t:${Math.round(Date.now()/1000)}:R>`, files: [`${process.env.pm2_home}/logs/Daggerbot-out.log`, `${process.env.pm2_home}/logs/Daggerbot-error.log`]}).then(()=>interaction.reply('It has been uploaded to dev server.')).catch((e:Error)=>interaction.reply(`\`${e.message}\``)),
      restart: async()=>{
        const i = await interaction.reply({content: 'Compiling TypeScript files...', fetchReply: true});
        exec('yarn tsc',{windowsHide:true},(err:Error)=>{
          if (err) i.edit(`\`\`\`${UsernameHelper.stripName(err.message)}\`\`\``)
          else i.edit(`Successfully compiled TypeScript files into JavaScript!\nUptime before restarting: **${FormatTime(client.uptime, 3, {commas: true, longNames: true})}**`).then(()=>exec('pm2 restart Daggerbot', {windowsHide:true}))
        })
      },
      file: ()=>interaction.reply({files:[`./src/database/${interaction.options.getString('name')}.json`]}).catch(()=>'Filesize is too large, upload cancelled.'),
      wake_device: async()=>{
        const i = await interaction.reply({content: 'Spawning a task...', fetchReply: true});
        exec(`cd "../../Desktop/System Tools/wakemeonlan" && WakeMeOnLan.exe /wakeup ${interaction.options.getString('name')}`, {windowsHide:true}, (err:Error)=>{
          if (err) i.edit(UsernameHelper.stripName(err.message))
          else i.edit('Your device should be awake by now!\n||Don\'t blame me if it isn\'t on.||')
        })
      },
      dm: async()=>{
        const member = interaction.options.getMember('member');
        const message = interaction.options.getString('message');
        const int = await interaction.reply({content: '*Sending...*', fetchReply: true});
        member.send(message).then(()=>int.edit(`Successfully sent a DM to **${member.user.username}** with the following message:\n\`\`\`${message}\`\`\``)).catch((e:Error)=>int.edit(`\`${e.message}\``))
      }
    } as any)[interaction.options.getSubcommand()]();
  },
  data: new Discord.SlashCommandBuilder()
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
      .setName('logs')
      .setDescription('Retrieve the logs from host and sends it to dev server'))
    .addSubcommand(x=>x
      .setName('restart')
      .setDescription('Restart the bot for technical reasons'))
    .addSubcommand(x=>x
      .setName('update')
      .setDescription('Pull from repository and restart')
      .addBooleanOption(x=>x
        .setName('restart')
        .setDescription('Restart the bot after pulling from repository')
        .setRequired(true)
      ))
    .addSubcommand(x=>x
      .setName('wake_device')
      .setDescription('Remotely wake up a device in the same network as the bot')
      .addStringOption(x=>x
        .setName('name')
        .setDescription('Device name')
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('statsgraph')
      .setDescription('Edit the number of data points to pull')
      .addStringOption(x=>x
        .setName('server')
        .setDescription('Server name')
        .setRequired(true))
      .addIntegerOption(x=>x
        .setName('number')
        .setDescription('Number of data points to pull')
        .setRequired(true)))
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
      .setName('file')
      .setDescription('Send a JSON file from database directory on the host')
      .addStringOption(x=>x
        .setName('name')
        .setDescription('JSON filename, don\'t include an extension')
        .setRequired(true)))
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
}
