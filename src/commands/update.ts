import Discord from 'discord.js';
import { TClient } from 'src/client';
import { exec } from 'node:child_process';
export default {
    async run(client: TClient, message: Discord.Message, args: any){
        if (!client.config.eval.whitelist.includes(message.author.id)) return message.reply('You\'re not allowed to use this command')
        const msg = await message.reply({content: 'Pulling...', fetchReply: true})
        exec(
            'git pull',(err:Error,stdout)=>{
                if (err){
                    msg.edit(`Pull failed:\n\`\`\`${err.message}\`\`\``)
                } else if (stdout.includes('Already up to date')){
                    msg.edit(`Pull aborted:\nUp to date with the repository`)
                } else {
                    setTimeout(()=>{msg.edit('Restarting...').then(()=>eval(process.exit(-1)))},1000)
                }
            }
        )
    },
    name: 'update',
    description: 'Pull from repository and restart.',
    category: 'bot'
}