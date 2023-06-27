import Discord from 'discord.js';
import TClient from '../client.js';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    function faqEmbed(color:Discord.ColorResolvable,title:string,description?:string|null,image?:string|null){
      const embed = new client.embed().setColor(color).setTitle(title);
      if (description) embed.setDescription(description);
      if (image) embed.setImage(image);
      return embed
    } // I am loving this fancy idea, pretty simplified!
    ({
      srp: ()=>interaction.reply('[Ballyspring](<https://www.farming-simulator.com/mod.php?mod_id=270745>) is the map that is used in Survival Roleplay S4.\n\n> ℹ️ __Note__\n> The map won\'t look closely like the one in SRP as it is privately edited version of the public map.'),
      vtcR: ()=>interaction.reply(`You can get the <@&${client.config.mainServer.roles.vtcmember}> role from <#802283932430106624> by clicking :truck: button on a webhook's message\n*VTC skin can also be found in <#801975222609641472> as well.*`),
      mpR: ()=>interaction.reply(`You can get the <@&${client.config.mainServer.roles.mpplayer}> role from <#802283932430106624> by clicking :tractor: button on webhook's message`),
      ytscam: ()=>interaction.reply({embeds: [faqEmbed(client.config.embedColor, 'Scammers in YouTube comments section', 'If you ever see a comment mentioning a giveaway or anything else, **it\'s a scam!**\nYou should report it to YouTube and move on or ignore it.\nP.S: They\'re on every channel and not just Daggerwin.', 'https://cdn.discordapp.com/attachments/1015195575693627442/1068078284996345916/image.png')]}),
      steamscam: ()=>interaction.reply({embeds: [faqEmbed(client.config.embedColor, 'Steam account report scam', 'If you received a DM about this, please report it to Discord Moderators or open a [ticket](https://discord.com/channels/468835415093411861/942173932339986472/1054128182468546631)', 'https://cdn.discordapp.com/attachments/1091300529696673792/1122266621088645130/image.png')]}),
      fsShader: ()=>interaction.reply({embeds: [faqEmbed(client.config.embedColor, 'Clearing your shader cache folder', 'If your game keeps crashing shortly after opening your game, then the shaders might be an issue.\nTo resolve this, you can go to `Documents/My Games/FarmingSimulator2022` and delete the folder called `shader_cache`', 'https://cdn.discordapp.com/attachments/1015195575693627442/1015195687970943016/unknown.png')]}),
      fsLogfile: ()=>interaction.reply({embeds: [faqEmbed(client.config.embedColor, 'Uploading your log file', 'You can find `log.txt` in `Documents/My Games/FarmingSimulator2022` and upload it into <#596989522395398144> along with your issue, so people can assist you further and help you resolve.', 'https://cdn.discordapp.com/attachments/1015195575693627442/1015195643528101958/unknown.png')]}),
      fsDevConsole: ()=>interaction.reply({embeds: [faqEmbed(client.config.embedColor, 'Enabling the development console', 'Head over to `game.xml` in `Documents/My Games/FarmingSimulator2022` and find the section that mentions `<controls>false</controls>` inside development section, change it to `true` then you are good to go!\nFYI: The keybind to open console is \``\u200b\` (backtick).', 'https://cdn.discordapp.com/attachments/1015195575693627442/1097273921444790322/image.png')]})
    } as any)[interaction.options.getString('question', true)]();
  },
  data: new Discord.SlashCommandBuilder()
  .setName('faq')
  .setDescription('List of questions, e.g; log file for FS, YT Scams and etc.')
  .addStringOption(x=>x
    .setName('question')
    .setDescription('What question do you want answered?')
    .setRequired(true)
    .addChoices(
      { name: 'Survival Roleplay Map', value: 'srp'},
      { name: 'Scams in YT comments', value: 'ytscam' },
      { name: 'Steam account report scam', value: 'steamscam' },
      { name: 'VTC Role', value: 'vtcR' },
      { name: 'MP Role', value: 'mpR' },
      { name: '[FS22] Resolve shader_cache issue', value: 'fsShader' },
      { name: '[FS22] Log file location', value: 'fsLogfile' },
      { name: '[FS22] Enabling the console', value: 'fsDevConsole' }
    ))
}
