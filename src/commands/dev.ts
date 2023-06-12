import Discord from 'discord.js';
import {Octokit} from '@octokit/rest';
import {createTokenAuth} from '@octokit/auth-token';
import {exec} from 'node:child_process';
import fs from 'node:fs';
import util from 'node:util';
import TClient from '../client.js';
import path from 'node:path';
const removeUsername = (text: string)=>{
  let matchesLeft = true;
  const array = text.split('\\');
  while (matchesLeft){
    let usersIndex = array.indexOf('Users');
    if (usersIndex<1) matchesLeft = false;
    else {
      let usernameIndex = usersIndex+1;
      if(array[usernameIndex].length == 0) usernameIndex += 1;
      array[usernameIndex] = '*'.repeat(array[usernameIndex].length);
      array[usersIndex] = 'Us\u200bers';
    }
  } return array.join('\\');
};
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>) {
    if (!client.config.whitelist.includes(interaction.user.id)) return client.youNeedRole(interaction, 'bottech');
    ({
      eval: async()=>{
        if (!client.config.eval) return interaction.reply({content: 'Eval is currently disabled.', ephemeral: true});
        const code = interaction.options.getString('code') as string;
        let output = 'error';
        let error = false;
        try {
          output = await eval(code);
        } catch (err: any) {
          error = true
          const embed = new client.embed().setColor('#ff0000').setTitle('__Eval__').addFields(
            {name: 'Input', value: `\`\`\`js\n${code.slice(0, 1010)}\n\`\`\``},
            {name: 'Output', value: `\`\`\`\n${err}\`\`\``}
          )
          interaction.reply({embeds: [embed]}).catch(()=>(interaction.channel as Discord.TextChannel).send({embeds: [embed]})).then(()=>{
            const filter = (x:any)=>x.content === 'stack' && x.author.id === interaction.user.id
            const messagecollector = (interaction.channel as Discord.TextChannel).createMessageCollector({filter, max: 1, time: 60000});
            messagecollector.on('collect', collected=>{
              collected.reply({content: `\`\`\`\n${removeUsername(err.stack)}\n\`\`\``, allowedMentions: {repliedUser: false}});
            });
          });
        }
        if (error) return;
        if (typeof output === 'object') output = 'js\n'+util.formatWithOptions({depth: 1}, '%O', output)
        else output = '\n' + String(output);
        [
          client.tokens.main,client.tokens.beta,client.tokens.toast,client.tokens.webhook_url,
          client.tokens.webhook_url_test,client.tokens.mongodb_uri,client.tokens.mongodb_uri_dev,client.tokens.octokit
        ].forEach(x=>output = output.replace(new RegExp(x as string,'g'),':noblank: No token?'));
        const embed = new client.embed().setColor(client.config.embedColor).setTitle('__Eval__').addFields(
          {name: 'Input', value: `\`\`\`js\n${code.slice(0,1010)}\n\`\`\``},
          {name: 'Output', value: `\`\`\`${removeUsername(output).slice(0,1016)}\n\`\`\``}
        );
        interaction.reply({embeds: [embed]}).catch(()=>(interaction.channel as Discord.TextChannel).send({embeds: [embed]}));
      },
      update: async()=>{
        const SummonAuthentication = createTokenAuth(client.tokens.octokit);
        const {token} = await SummonAuthentication();
        var githubRepo = {owner: 'AnxietyisReal', repo: 'Daggerbot-TS', ref: 'HEAD'};
        const clarkson = await interaction.reply({content: 'Pulling from repository...', fetchReply: true});
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
        exec('git pull',(err:Error,stdout)=>{
          if (err) clarkson.edit(`\`\`\`${removeUsername(err.message)}\`\`\``)
          else if (stdout.includes('Already up to date')) clarkson.edit('I am already up to date with the upstream repository.')
          else clarkson.edit('Compiling TypeScript files...').then(()=>exec('tsc', (err:Error)=>{
            if (err) clarkson.edit(`\`\`\`${removeUsername(err.message)}\`\`\``)
            else clarkson.edit(`[Commit:](<${github.fetchCommit.url}>) **${github.fetchCommit.msg}**\nCommit author: **${github.fetchCommit.author}**\n\n__Commit changes__\nTotal: **${github.fetchChanges.total}**\nAdditions: **${github.fetchChanges.addition}**\nDeletions: **${github.fetchChanges.deletion}**\n\nSuccessfully compiled TypeScript files into JavaScript!\nUptime before restarting: **${client.formatTime(client.uptime as number, 3, {commas: true, longNames: true})}**`).then(()=>exec('pm2 restart Daggerbot'))
          }))
        });
      },
      presence: ()=>{
        function convertType(Type?: number){
          switch (Type) {
            case 0: return 'Playing';
            case 1: return 'Streaming';
            case 2: return 'Listening to';
            case 3: return 'Watching';
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
        interaction.reply([
          'Presence updated:',
          `Status: **${client.config.botPresence.status}**`,
          `Type: **${convertType(currentActivities[0].type)}**`,
          `Name: **${currentActivities[0].name}**`,
          `URL: \`${currentActivities[0].url}\``
        ].join('\n'))
      },
      statsgraph: ()=>{
        client.statsGraph = -(interaction.options.getInteger('number', true));
        interaction.reply(`Successfully set to \`${client.statsGraph}\`\n*Total data points: **${JSON.parse(fs.readFileSync('src/database/MPPlayerData.json', {encoding: 'utf8'})).length.toLocaleString()}***`)
      },
      logs: ()=>{
        interaction.deferReply();
        (client.channels.resolve(client.config.mainServer.channels.console) as Discord.TextChannel).send({content: `Uploaded the current console dump as of <t:${Math.round(Date.now()/1000)}:R>`, files: [`${process.env.pm2_home}/logs/Daggerbot-out.log`, `${process.env.pm2_home}/logs/Daggerbot-error.log`]}).then(()=>interaction.editReply('It has been uploaded to dev server.')).catch((e:Error)=>interaction.editReply(`\`${e.message}\``))
      },
      restart: async()=>{
        const i = await interaction.reply({content: 'Compiling TypeScript files...', fetchReply: true});
        exec('tsc',(err:Error)=>{
          if (err) i.edit(`\`\`\`${removeUsername(err.message)}\`\`\``)
          else i.edit(`Successfully compiled TypeScript files into JavaScript!\nUptime before restarting: **${client.formatTime(client.uptime as number, 3, {commas: true, longNames: true})}**`).then(()=>exec('pm2 restart Daggerbot'))
        })
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
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('logs')
      .setDescription('Retrieve the logs from host and sends it to dev server'))
    .addSubcommand(x=>x
      .setName('restart')
      .setDescription('Restart the bot for technical reasons'))
    .addSubcommand(x=>x
      .setName('update')
      .setDescription('Pull from repository and restart'))
    .addSubcommand(x=>x
      .setName('statsgraph')
      .setDescription('Edit the number of data points to pull')
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
        .setChoices(
          {name: 'Online', value: Discord.PresenceUpdateStatus.Online},
          {name: 'Idle', value: Discord.PresenceUpdateStatus.Idle},
          {name: 'Do Not Distrub', value: Discord.PresenceUpdateStatus.DoNotDisturb},
          {name: 'Invisible', value: Discord.PresenceUpdateStatus.Offline}
        )))
}
