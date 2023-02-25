import Discord,{SlashCommandBuilder} from 'discord.js';
import TClient from 'src/client';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    ({
      dlskin: ()=>interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Daggerwin Logistics hex code').setDescription('The main color will be Onyx (`#353839`) with red bumpers.').setImage('https://cdn.discordapp.com/attachments/801965516947324969/806871878736019456/image0.png')]}),
      vtcR: ()=>interaction.reply(`You can get the <@&${client.config.mainServer.roles.vtcmember}> role from <#802283932430106624> by reacting <@282859044593598464>'s message with :truck:\n*VTC skin can also be found in <#801975222609641472> as well.*`),
      mpR: ()=>interaction.reply(`You can get the <@&${client.config.mainServer.roles.mpplayer}> role from <#802283932430106624> by reacting <@282859044593598464>'s message with :tractor:`),
      ytscam: ()=>interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Scammers in YouTube comments section').setDescription('If you ever see a comment mentioning a giveaway or anything else, **it\'s a scam!**\nYou should report it to YouTube and move on or ignore it.\nP.S: They\'re on every channel and not just Daggerwin.').setImage('https://cdn.discordapp.com/attachments/1015195575693627442/1068078284996345916/image.png')]}),
      fsShader: ()=>interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Clearing your shader cache folder').setDescription('If your game kees crashing shortly after opening your game, then the shaders might be an issue.\nTo resolve this, you can go to `Documents/My Games/FarmingSimulator2022` and delete the folder called `shader_cache`').setImage('https://cdn.discordapp.com/attachments/1015195575693627442/1015195687970943016/unknown.png')]}),
      fsLogfile: ()=>interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Uploading your log file').setDescription('You can find `log.txt` in `Documents/My Games/FarmingSimulator2022` and upload it into <#596989522395398144> along with your issue, so people can assist you further and help you resolve.').setImage('https://cdn.discordapp.com/attachments/1015195575693627442/1015195643528101958/unknown.png')]})
    } as any)[interaction.options.getString('question', true)]();
  },
  data: new SlashCommandBuilder()
  .setName('faq')
  .setDescription('List of questions, e.g; log file for FS, YT Scams and etc.')
  .addStringOption((opt)=>opt
    .setName('question')
    .setDescription('What question do you want answered?')
    .setRequired(true)
    .addChoices(
      { name: 'Daggerwin Logistics hex code', value: 'dlskin' },
      { name: 'Scams in YT comments', value: 'ytscam' },
      { name: 'VTC Role', value: 'vtcR' },
      { name: 'MP Role', value: 'mpR' },
      { name: '[FS22] Resolve shader_cache issue', value: 'fsShader' },
      { name: '[FS22] Log file location', value: 'fsLogfile' }
    ))
}
