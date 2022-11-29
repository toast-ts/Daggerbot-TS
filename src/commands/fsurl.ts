import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
import MPDB from '../models/MPServer';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager) && !interaction.member.roles.cache.has(client.config.mainServer.roles.bottech) && !interaction.member.roles.cache.has(client.config.mainServer.roles.admin)) return client.youNeedRole(interaction, 'mpmanager');

        MPDB.sync();
        const newServerId = interaction.guildId
        const address = interaction.options.getString('address')

        if (!address) {
            try {
                const Url = await MPDB.findOne({where: {serverId: newServerId}})
                if (Url.ip && Url.code){return interaction.reply(`${Url.get('ip')}` + '/feed/dedicated-server-stats.json?code=' + `${Url.get('code')}`)}
            } catch(err) {
                    console.log(`MPDB | Error: ${err}`)
                    interaction.reply('**Database error:**\nTry inserting an URL first.')
            }
        } else {
            const verifyURL = address.match(/feed/)
            if (!verifyURL) return interaction.reply('That URL is not a valid `dedicated-server-stats.xml`')
            const convertURL = address
            const newURL = convertURL.replace('xml','json').split('/feed/dedicated-server-stats.json?code=')
            try {
                console.log(`MPDB | URL for ${interaction.guild.name} has been updated by ${interaction.member.displayName} (${interaction.member.id})`)
                const Url = await MPDB.create({
                    serverId: newServerId,
                    ip: newURL[0],
                    code: newURL[1],
                    timesUpdated: 0
                });
                return interaction.reply(`Successfully set the URL to ${Url.ip}`)
            } catch(err) {
                if (err.name == 'SequelizeUniqueConstraintError'){
                    const AffectedRows = await MPDB.update({ip: newURL[0], code: newURL[1]},{where:{serverId: newServerId}});
                    await MPDB.increment('timesUpdated', {where: {serverId: newServerId}});
                    if (AffectedRows){return interaction.reply(`Successfully updated the URL to ${newURL[0]}`)}
                } else {
                    console.log(err)
                    interaction.reply(`\`MPDB\` has caught an error, notify <@&${client.config.mainServer.roles.bottech}>`)
                }
                
            }
        }
    },
    data: new SlashCommandBuilder()
        .setName('url')
        .setDescription('View the URL for this server\'s FSMP server or update the URL')
        .setDMPermission(false)
        .addStringOption((opt)=>opt
            .setName('address')
            .setDescription('Insert a \'dedicated-server-stats\' url'))
}