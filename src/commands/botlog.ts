import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        if (!client.config.eval.whitelist.includes(interaction.user.id)) return client.youNeedRole(interaction, 'bottech');
        (client.channels.resolve(client.config.mainServer.channels.console) as Discord.TextChannel).send({content: `Uploaded the current console dump as of <t:${Math.round(Date.now()/1000)}:R>`, files: ['../../.pm2/logs/Daggerbot-out.log']})
        await interaction.reply('It has been uploaded to dev server.')
    },
    data: new SlashCommandBuilder()
        .setName('botlog')
        .setDescription('Retrieves the log from host and sends it to development server.')
        .setDMPermission(false)
} 
