import Discord,{SlashCommandBuilder} from 'discord.js';
import { Octokit } from '@octokit/rest';
import {exec} from 'node:child_process';
import { readFileSync } from 'node:fs';
import * as util from 'node:util';
import TClient from 'src/client';
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
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>) {
        if (!client.config.eval.whitelist.includes(interaction.user.id)) return client.youNeedRole(interaction, 'bottech');
        switch (interaction.options.getSubcommand()){
            case 'eval':
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
                if (typeof output == 'object') {
                    output = 'js\n'+util.formatWithOptions({depth: 1}, '%O', output)        
                } else {
                    output = '\n' + String(output);
                }
                [client.tokens.token_main,client.tokens.token_beta,client.tokens.token_toast,client.tokens.token_tae].forEach((x)=>{
                    const regexp = new RegExp(x as string,'g');
                    output = output.replace(regexp, ':noblank: No token?');
                })
                const embed = new client.embed().setColor(client.config.embedColor).setTitle('__Eval__').addFields(
                    {name: 'Input', value: `\`\`\`js\n${code.slice(0,1010)}\n\`\`\``},
                    {name: 'Output', value: `\`\`\`${removeUsername(output).slice(0,1016)}\n\`\`\``}
                );
                interaction.reply({embeds: [embed]}).catch(()=>(interaction.channel as Discord.TextChannel).send({embeds: [embed]}));
                break
            case 'logs':
                interaction.deferReply();
                (client.channels.resolve(client.config.mainServer.channels.console) as Discord.TextChannel).send({content: `Uploaded the current console dump as of <t:${Math.round(Date.now()/1000)}:R>`, files: [`${process.env.pm2_home}/logs/Daggerbot-out-0.log`, `${process.env.pm2_home}/logs/Daggerbot-error-0.log`]}).then(()=>interaction.editReply('It has been uploaded to dev server.')).catch((e:Error)=>interaction.editReply(`\`${e.message}\``))
                break
            case 'restart':
                client.userLevels.forceSave();
                interaction.reply(`Uptime before restarting: **${client.formatTime(client.uptime as number, 3, {commas: true, longNames: true})}**`).then(()=>exec('pm2 restart Daggerbot'))
                break
            case 'update':
                var githubRepo = {owner: 'AnxietyisReal', repo: 'Daggerbot-TS', ref: 'HEAD'}
                const octokit = new Octokit({timeZone: 'Australia/NSW', userAgent: 'Daggerbot'})
                const fetchCommitMsg = await octokit.repos.getCommit(githubRepo).then(x=>x.data.commit.message);
                const fetchCommitAuthor = await octokit.repos.getCommit(githubRepo).then(x=>x.data.commit.author.name);
                const clarkson = await interaction.reply({content: 'Pulling from repository...', fetchReply: true});
                exec('git pull',(err:Error,stdout)=>{
                    if (err){
                        clarkson.edit(`\`\`\`${removeUsername(err.message)}\`\`\``)
                    } else if (stdout.includes('Already up to date')){
                        clarkson.edit('Bot is already up to date with the repository, did you forgor to push the changes? :skull:')
                    } else {
                        setTimeout(()=>{clarkson.edit(`Commit: **${fetchCommitMsg}**\nCommit author: **${fetchCommitAuthor}**\n\nUptime before restarting: **${client.formatTime(client.uptime as number, 3, {commas: true, longNames: true})}**`).then(()=>exec('pm2 restart Daggerbot'))},650)
                    }
                });
                break
            case 'statsgraph':
                client.statsGraph = -(interaction.options.getInteger('number', true))
                interaction.reply(`Successfully set to \`${client.statsGraph}\`\n*Total data points: **${JSON.parse(readFileSync(path.join(__dirname, '../database/MPPlayerData.json'), {encoding: 'utf8'})).length.toLocaleString()}***`);
                break
        }
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
}
