import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        const options = interaction.options.getString('question')
        if (options == 'srp'){
            const embed = new client.embed().setColor(client.config.embedColor).setTitle('When will SRP (Survival Roleplay) return?').setImage('https://cdn.discordapp.com/attachments/1023338018720989305/1059259250242752562/IMG_8964.png');
            interaction.reply({embeds: [embed]})
        } else if (options == 'dlskin'){
            const embed1 = new client.embed().setColor(client.config.embedColor).setTitle('Hex code for Daggerwin Logistics').setDescription('The main color will be Onyx (`#353839`) with red bumpers').setImage('https://cdn.discordapp.com/attachments/801965516947324969/806871878736019456/image0.png');
            interaction.reply({embeds: [embed1]})
        } else if (options == 'vtcR'){
            interaction.reply(`You can get the <@&${client.config.mainServer.roles.vtcmember}> role from <#802283932430106624> by reacting the ProBot\'s message with :truck:\n*VTC skin can also be found in <#801975222609641472> as well.*`)
        } else if (options == 'mpR'){
            interaction.reply(`You can get the <@&${client.config.mainServer.roles.mpplayer}> role from <#802283932430106624> by reacting the ProBot\'s message with :tractor:`)
        } else if (options == 'fsShader'){
            const embed2 = new client.embed().setColor(client.config.embedColor).setTitle('Clearing your shader cache folder').setDescription('If your game kees crashing shortly after opening your game, then the shaders might be an issue.\nTo resolve this, you can go to `Documents/My Games/FarmingSimulator2022` and delete the folder called `shader_cache`').setImage('https://cdn.discordapp.com/attachments/1015195575693627442/1015195687970943016/unknown.png');
            interaction.reply({embeds: [embed2]})
        } else if (options == 'fsLogfile'){
            const embed3 = new client.embed().setColor(client.config.embedColor).setTitle('Uploading your log file').setDescription('You can find `log.txt` in `Documents/My Games/FarmingSimulator2022` and upload it into <#596989522395398144> along with your issue, so people can assist you further and help you resolve.').setImage('https://cdn.discordapp.com/attachments/1015195575693627442/1015195643528101958/unknown.png');
            interaction.reply({embeds: [embed3]})
        }
    },
    data: new SlashCommandBuilder()
        .setName('faq')
        .setDescription('List of FAQ for users')
        .setDMPermission(false)
        .addStringOption((opt)=>opt
            .setName('question')
            .setDescription('What question do you want answered?')
            .addChoices(
                { name: 'Survival Roleplay', value: 'srp' },
                { name: 'Daggerwin Logistics hex code', value: 'dlskin' },
                { name: 'VTC Role', value: 'vtcR' },
                { name: 'MP Role', value: 'mpR' },
                { name: '[FS22] Resolve shader_cache issue', value: 'fsShader' },
                { name: '[FS22] Log file location', value: 'fsLogfile' }
            ))
        
}