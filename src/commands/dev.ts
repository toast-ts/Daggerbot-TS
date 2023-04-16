import Discord,{SlashCommandBuilder} from 'discord.js';
import {Octokit} from '@octokit/rest';
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
    if (!client.config.eval.whitelist.includes(interaction.user.id)) return client.youNeedRole(interaction, 'bottech');
    ({
      eval: async()=>{
        if (!client.config.eval.allowed) return interaction.reply({content: 'Eval is disabled.', ephemeral: true});
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
          interaction.reply({embeds: [embed]}).catch(()=>(interaction.channel as Discord.TextChannel).send({embeds: [embed]})).then(errorEmbedMessage=>{
            const filter = (x:any)=>x.content === 'stack' && x.author.id === interaction.user.id
            const messagecollector = (interaction.channel as Discord.TextChannel).createMessageCollector({filter, max: 1, time: 60000});
            messagecollector.on('collect', collected=>{
              collected.reply({content: `\`\`\`\n${removeUsername(err.stack)}\n\`\`\``, allowedMentions: {repliedUser: false}});
            });
          });
        }
        if (error) return;
        if (typeof output == 'object') output = 'js\n'+util.formatWithOptions({depth: 1}, '%O', output)        
        else output = '\n' + String(output);
        
        [client.tokens.main,client.tokens.beta,client.tokens.toast,client.tokens.tae,client.tokens.webhook_url,client.tokens.webhook_url_test,client.tokens.mongodb_uri,client.tokens.mongodb_uri_dev].forEach((x)=>{
          const regexp = new RegExp(x as string,'g');
          output = output.replace(regexp, ':noblank: No token?');
        })
        const embed = new client.embed().setColor(client.config.embedColor).setTitle('__Eval__').addFields(
          {name: 'Input', value: `\`\`\`js\n${code.slice(0,1010)}\n\`\`\``},
          {name: 'Output', value: `\`\`\`${removeUsername(output).slice(0,1016)}\n\`\`\``}
        );
        interaction.reply({embeds: [embed]}).catch(()=>(interaction.channel as Discord.TextChannel).send({embeds: [embed]}));
      },
      update: async()=>{
        var githubRepo = {owner: 'AnxietyisReal', repo: 'Daggerbot-TS', ref: 'HEAD'}
        const octokit = new Octokit({timeZone: 'Australia/NSW', userAgent: 'Daggerbot'})
        const fetchCommitMsg = await octokit.repos.getCommit(githubRepo).then(x=>x.data.commit.message).catch(err=>{console.log(err); interaction.reply({content: 'Placeholder error for `fetchCommitMsg`', ephemeral: true})});
        const fetchCommitAuthor = await octokit.repos.getCommit(githubRepo).then(x=>x.data.commit.author.name).catch(err=>{console.log(err); interaction.reply({content: 'Placeholder error for `fetchCommitAuthor`', ephemeral: true})});
        const clarkson = await interaction.reply({content: 'Pulling from repository...', fetchReply: true});
        exec('git pull',(err:Error,stdout)=>{
          if (err) clarkson.edit(`\`\`\`${removeUsername(err.message)}\`\`\``)
          else if (stdout.includes('Already up to date')) clarkson.edit('Bot is already up to date with the repository, did you forgor to push the changes? :skull:')
          else clarkson.edit('Compiling TypeScript files...').then(()=>exec('tsc', (err:Error)=>{
            if (err) clarkson.edit(`\`\`\`${removeUsername(err.message)}\`\`\``)
            else clarkson.edit(`Commit: **${fetchCommitMsg}**\nCommit author: **${fetchCommitAuthor}**\n\nSuccessfully compiled TypeScript files into JavaScript!\nUptime before restarting: **${client.formatTime(client.uptime as number, 3, {commas: true, longNames: true})}**`).then(()=>exec('pm2 restart Daggerbot'))
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
        interaction.reply(`Successfully set to \`${client.statsGraph}\`\n*Total data points: **${JSON.parse(fs.readFileSync(path.join(__dirname, '../database/MPPlayerData.json'), {encoding: 'utf8'})).length.toLocaleString()}***`)
      },
      logs: ()=>{
        interaction.deferReply();
        (client.channels.resolve(client.config.mainServer.channels.console) as Discord.TextChannel).send({content: `Uploaded the current console dump as of <t:${Math.round(Date.now()/1000)}:R>`, files: [`${process.env.pm2_home}/logs/Daggerbot-out-0.log`, `${process.env.pm2_home}/logs/Daggerbot-error-0.log`]}).then(()=>interaction.editReply('It has been uploaded to dev server.')).catch((e:Error)=>interaction.editReply(`\`${e.message}\``))
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
  data: new SlashCommandBuilder()
    .setName('dev')
    .setDescription('Developer commands')
    .addSubcommand((optt)=>optt
      .setName('eval')
      .setDescription('Execute the code to the bot')
      .addStringOption((opt)=>opt
        .setName('code')
        .setDescription('Execute your code')
        .setRequired(true)))
    .addSubcommand((optt)=>optt
      .setName('logs')
      .setDescription('Retrieve the logs from host and sends it to dev server'))
    .addSubcommand((optt)=>optt
      .setName('restart')
      .setDescription('Restart the bot for technical reasons'))
    .addSubcommand((optt)=>optt
      .setName('update')
      .setDescription('Pull from repository and restart'))
    .addSubcommand((optt)=>optt
      .setName('statsgraph')
      .setDescription('Edit the number of data points to pull')
      .addIntegerOption((hiTae)=>hiTae
        .setName('number')
        .setDescription('Number of data points to pull')
        .setRequired(true)))
    .addSubcommand((optt)=>optt
      .setName('presence')
      .setDescription('Update the bot\'s presence')
      .addIntegerOption((hiTae)=>hiTae
        .setName('type')
        .setDescription('Set an activity type')
        .addChoices(
          {name: 'Playing', value: Discord.ActivityType.Playing},
          {name: 'Streaming', value: Discord.ActivityType.Streaming},
          {name: 'Listening to', value: Discord.ActivityType.Listening},
          {name: 'Watching', value: Discord.ActivityType.Watching},
          {name: 'Competing in', value: Discord.ActivityType.Competing}
        ))
      .addStringOption((hiAgain)=>hiAgain
        .setName('name')
        .setDescription('Set a message for the activity status'))
      .addStringOption((hiAgainx2)=>hiAgainx2
        .setName('url')
        .setDescription('Set an url for streaming status'))
      .addStringOption((hiAgainx3)=>hiAgainx3
        .setName('status')
        .setDescription('Set a status indicator for the bot')
        .setChoices(
          {name: 'Online', value: Discord.PresenceUpdateStatus.Online},
          {name: 'Idle', value: Discord.PresenceUpdateStatus.Idle},
          {name: 'Do Not Distrub', value: Discord.PresenceUpdateStatus.DoNotDisturb},
          {name: 'Invisible', value: Discord.PresenceUpdateStatus.Offline}
        )))
}
