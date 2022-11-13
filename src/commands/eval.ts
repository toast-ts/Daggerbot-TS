import Discord from 'discord.js';
import { TClient } from 'src/client';
import * as util from 'node:util';
const removeUsername = (text: string)=>{
    let matchesLeft = true;
    const array = text.split('\/');
    while (matchesLeft){
        let usersIndex = array.indexOf('home');
        if (usersIndex<1) matchesLeft = false;
        else {
            let usernameIndex = usersIndex+1;
            if(array[usernameIndex].length == 0) usernameIndex += 1;
            array[usernameIndex] = '*'.repeat(array[usernameIndex].length);
            array[usersIndex] = 'ho\u200bme';
        }
    } return array.join('\/');
};
export default {
    async run(client: TClient, message: Discord.Message, args: any) {
        if (!client.config.eval.allowed) return message.channel.send('Eval is disabled.');
        if (!client.config.eval.whitelist.includes(message.author.id)) return message.reply('You\'re not allowed to use this command.');
        const code = message.content.slice(client.config.prefix.length+args[0].length+1);
        let output = 'error';
        let error = false;
        try {
            output = await eval(code)
        } catch (err: any) {
            error = true
            const embed = new client.embed().setColor('ff0000').setTitle('__Eval__').addFields(
                {name: 'Input', value: `\`\`\`js\n${code.slice(0, 1010)}\n\`\`\``},
                {name: 'Output', value: `\`\`\`\n${err}\`\`\``}
            )
            message.channel.send({embeds: [embed]}).then(errorEmbedMessage=>{
                const filter = x=>x.content === 'stack' && x.author.id === message.author.id
                const messagecollector = message.channel.createMessageCollector({filter, max: 1, time: 60000});
                messagecollector.on('collect',collected=>{
                    collected.channel.send(`\`\`\`\n${removeUsername(err.stack)}\n\`\`\``);
                });
            });
        }
        if (error) return;
        if (typeof output !== 'string') {
            output = 'js\n'+util.formatWithOptions({depth: 1}, '%O', output)
        } else {
            output = '\n' + String(output);
        }
        if (typeof output == 'object') {
            output = 'js\n'+util.formatWithOptions({depth: 1}, '%O', output)        
        } else {
            output = '\n' + String(output);
        }
        [client.tokens.token_main,client.tokens.token_beta,client.tokens.token_toast,client.tokens.token_tae].forEach((x)=>{
            const regexp = new RegExp(x,'g');
            output = output.replace(regexp, 'TOKEN_LEAK');
        })
        const embed = new client.embed().setColor(client.config.embedColor).setTitle('__Eval__').addFields(
            {name: 'Input', value: `\`\`\`js\n${code.slice(0,1010)}\n\`\`\``},
            {name: 'Output', value: `\`\`\`${removeUsername(output).slice(0,1016)}\n\`\`\``}
        );
        message.channel.send({embeds: [embed]})
    },
    name: 'eval',
    description: 'Run code for debugging purposes',
    category: 'bot'
}