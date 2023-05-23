import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    const inviteCode = interaction.options.getString('code',true).replace(/(https:\/\/|discord.gg\/)/g,'')
    await client.axios.get(`https://discord.com/api/v${Discord.APIVersion}/invites/${inviteCode}`).then(async inviteInfo=>
      await interaction.reply({embeds: [
        new client.embed().setColor(client.config.embedColor).setURL(`https://discord.gg/${inviteInfo.data.code}`).setTitle(inviteInfo.data.guild.name).setDescription([
          `ID: \`${inviteInfo.data.guild.id}\``,
          `Description: \`\`\`${inviteInfo.data.guild.description != null ? inviteInfo.data.guild.description : 'No description set.'}`,
          `\`\`\`Total server boosters: \`${inviteInfo.data.guild.premium_subscription_count}\``,
          `Channel: \`#${inviteInfo.data.channel.name}\``
        ].join('\n'))
      ]})).catch(err=>interaction.reply(`\`${err}\``))
  },
  data: new Discord.SlashCommandBuilder()
    .setName('inviteinfo')
    .setDescription('View the invite data')
    .addStringOption(x=>x
      .setName('code')
      .setDescription('Discord invite code'))
}