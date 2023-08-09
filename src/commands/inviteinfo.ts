import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    await client.fetchInvite(interaction.options.getString('code',true).replace(/(https:\/\/|discord.gg\/)/g,'')).then(async inviteData=>
      await interaction.reply({embeds:[new client.embed()
        .setColor(client.config.embedColor).setURL(`https://discord.gg/${inviteData.code}`).setTitle(inviteData.guild.name).setDescription([
          `ID: \`${inviteData.guild.id}\``,
          `Description: \`\`\`${inviteData.guild.description != null ? inviteData.guild.description : 'No description set.'}`,
          `\`\`\`Total server boosts: \`${inviteData.guild.premiumSubscriptionCount}\``,
          `Total members: \`${inviteData.presenceCount}\`**/**\`${inviteData.memberCount}\``,
          `Channel: \`#${inviteData.channel.name}\``,
        ].join('\n')).setThumbnail(inviteData.guild.iconURL({size:1024,extension:'webp'})).setImage(inviteData.guild.bannerURL({size:2048,extension:'webp'}))
      ]})).catch((err:Discord.DiscordAPIError)=>interaction.reply(err.message));
  },
  data: new Discord.SlashCommandBuilder()
    .setName('inviteinfo')
    .setDescription('View the server data from invite link')
    .addStringOption(x=>x
      .setName('code')
      .setDescription('Discord invite code')
      .setRequired(true))
}