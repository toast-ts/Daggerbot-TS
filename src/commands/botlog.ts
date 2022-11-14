import Discord from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, message: Discord.Message){
        if (!client.config.eval.whitelist.includes(message.author.id)) return message.reply('You\'re not allowed to use this command');
        (client.channels.resolve(client.config.mainServer.channels.console) as Discord.TextChannel).send({content: `Uploaded the current console dump as of <t:${Math.round(Date.now()/1000)}:R>`, files: ['../.pm2/logs/Daggerbot-out.log']})
        await message.reply({content: 'It has been uploaded to dev server.'})
    },
    name: 'botlog',
    description: 'Retrieves the bot\'s log from host and sends it to appropriate channel.',
    category: 'bot'
} 