import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        if (!client.config.eval.whitelist.includes(interaction.user.id)) return client.youNeedRole(interaction, 'bottech');
        client.userLevels.forceSave();
        interaction.reply(`Uptime before restarting: **${client.formatTime(client.uptime as number, 3, {commas: true, longNames: true})}**`).then(()=>require('node:child_process').exec('pm2 restart Daggerbot'))
    },
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Restart the bot for technical reasons')
        .setDMPermission(false)
}