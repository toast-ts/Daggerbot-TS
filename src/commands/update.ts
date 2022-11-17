import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
import { exec } from 'node:child_process';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        if (!client.config.eval.whitelist.includes(interaction.user.id)) return client.youNeedRole(interaction, 'bottech');
        const msg = await interaction.reply({content: 'Pulling...', fetchReply: true})
        exec(
            'git pull',(err:Error,stdout)=>{
                if (err){
                    msg.edit(`Pull failed:\n\`\`\`${err.message}\`\`\``)
                } else if (stdout.includes('Already up to date')){
                    msg.edit(`Pull aborted:\nUp to date with the repository`)
                } else {
                    setTimeout(()=>{msg.edit('Restarting...').then(()=>require('node:child_process').exec('pm2 restart Daggerbot'))},1000)
                }
            }
        )
    },
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Pull from repository and restart')
}