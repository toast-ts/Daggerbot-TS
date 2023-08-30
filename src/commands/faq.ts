import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    const verifyFaq = MessageTool.concatMessage(
      '```ansi',
      '[34m[1mSteam[0m (Top panel)',
      '1. Go to your game library and right click on Farming Simulator 22',
      '2. Click on Properties and navigate to "Installed Files"',
      '3. Click on "Verify integrity of game files"',
      '4. Steam will scan your game installation directory and will re-download anything that is corrupted or tampered with.',
      '',
      '[37m[1mEpic Games[0m (Bottom panel)',
      '1. Go to your game library and click on 3 dots (...)',
      '2. Click on Manage and click on "Verify"',
      '3. Epic Launcher will scan your game installation directory and will re-download anything that is corrupted or tampered with.',
      '```'
    );
    ({
      srp: ()=>interaction.reply('[Ballyspring](<https://www.farming-simulator.com/mod.php?mod_id=270745>) is the map that is used in Survival Roleplay S4.\n\n> ℹ️ __Note__\n> The map won\'t look closely like the one in SRP as it is privately edited version of the public map.'),
      vtcR: ()=>interaction.reply(`You can get the <@&${client.config.mainServer.roles.vtcmember}> role from <#802283932430106624> by clicking :truck: button on a webhook's message\n*VTC skin can also be found in <#801975222609641472> as well.*`),
      mpR: ()=>interaction.reply(`You can get the <@&${client.config.mainServer.roles.mpplayer}> role from <#802283932430106624> by clicking :tractor: button on webhook's message`),
      ytscam: ()=>interaction.reply({embeds: [MessageTool.embedStruct(client.config.embedColor, 'Scammers in YouTube comments section', 'If you ever see a comment mentioning a giveaway or anything else, **it\'s a scam!**\nYou should report it to YouTube and move on or ignore it.\nP.S: They\'re on every channel and not just Daggerwin.', 'https://cdn.discordapp.com/attachments/1015195575693627442/1068078284996345916/image.png')]}),
      steamscam: ()=>interaction.reply({embeds: [MessageTool.embedStruct(client.config.embedColor, 'Steam account report scam', 'If you received a DM about this, please report it to Discord Moderators or open a [ticket](https://discord.com/channels/468835415093411861/942173932339986472/1054128182468546631)', 'https://cdn.discordapp.com/attachments/1091300529696673792/1122266621088645130/image.png')]}),
      fsVerifyGame: ()=>interaction.reply({embeds: [MessageTool.embedStruct(client.config.embedColor, 'Verifying your game files', `You can verify your game files if you experience any issues with your game.\n${verifyFaq}`, 'https://cdn.discordapp.com/attachments/1015195575693627442/1138185771971526757/Steam-Epic-VerifyGamesLocation.png')]}),
      fsShader: ()=>interaction.reply({embeds: [MessageTool.embedStruct(client.config.embedColor, 'Clearing your shader cache folder', 'If your game keeps crashing shortly after opening your game, then the shaders might be an issue.\nTo resolve this, you can go to `Documents/My Games/FarmingSimulator2022` and delete the folder called `shader_cache`', 'https://cdn.discordapp.com/attachments/1015195575693627442/1015195687970943016/unknown.png')]}),
      fsLogfile: ()=>interaction.reply({embeds: [MessageTool.embedStruct(client.config.embedColor, 'Uploading your log file', 'You can find `log.txt` in `Documents/My Games/FarmingSimulator2022` and upload it into <#596989522395398144> along with your issue, so people can assist you further and help you resolve.', 'https://cdn.discordapp.com/attachments/1015195575693627442/1015195643528101958/unknown.png')]}),
      fsDevConsole: ()=>interaction.reply({embeds: [MessageTool.embedStruct(client.config.embedColor, 'Enabling the development console', 'Head over to `game.xml` in `Documents/My Games/FarmingSimulator2022` and find the section that mentions `<controls>false</controls>` inside development section, change it to `true` then you are good to go!\nFYI: The keybind to open console is \``\u200b\` (backtick).', 'https://cdn.discordapp.com/attachments/1015195575693627442/1097273921444790322/image.png')]})
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
      { name: '[FS] Verifying game files', value: 'fsVerifyGame' },
      { name: '[FS] Resolve shader_cache issue', value: 'fsShader' },
      { name: '[FS] Log file location', value: 'fsLogfile' },
      { name: '[FS] Enabling the console', value: 'fsDevConsole' }
    ))
}
