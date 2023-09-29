import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
import FAQStore from '../helpers/FAQStore.js';
export default {
  run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    const CDN =(filename:string)=>'https://oooo.ur-a-boykisser.ovh/r/'+filename+'.png';
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
    const youCanGetRole = (role:string, roleEmoji:string)=>`You can get the ${MessageTool.formatMention(client.config.mainServer.roles[role], 'role')} role from <#802283932430106624> by clicking :${roleEmoji}: button on a webhook's message.`;
    ({
      srp: ()=>FAQStore.reply(null, interaction, null, '[Ballyspring](<https://www.farming-simulator.com/mod.php?mod_id=270745>) is the map that is used in Survival Roleplay S4.\n\n> ℹ️ __Note__\n> The map won\'t look closely like the one in SRP as it is privately edited version of the public map.', null, false),
      vtcR: ()=>interaction.reply(youCanGetRole('vtcmember', 'truck')+'\n*VTC skin can also be found in <#801975222609641472> as well.*'),
      mpR: ()=>interaction.reply(youCanGetRole('mpplayer', 'tractor')),
      ytscam: ()=>FAQStore.reply(client, interaction, 'Scammers in YouTube comments section', 'If you ever see a comment mentioning a giveaway or anything else, **it\'s a scam!**\nYou should report it to YouTube and move on or ignore it.\nP.S: They\'re on every channel and not just Daggerwin.', CDN('YTScam'), true),
      steamscam: ()=>FAQStore.reply(client, interaction, 'Steam account report scam', 'If you received a DM about this, please report it to Discord Moderators or open a [ticket](https://discord.com/channels/468835415093411861/942173932339986472/1054128182468546631)', CDN('SteamScam'), true),
      fsVerifyGame: ()=>FAQStore.reply(client, interaction, 'Verifying your game files', `You can verify your game files if you experience any issues with your game.\n${verifyFaq}`, CDN('Steam-Epic-VerifyGamesLocation'), true),
      fsShader: ()=>FAQStore.reply(client, interaction, 'Clearing your shader cache folder', 'If your game keeps crashing shortly after opening your game, then the shaders might be an issue.\nTo resolve this, you can go to `Documents/My Games/FarmingSimulator2022` and delete the folder called `shader_cache`', CDN('shader_cache-Location'), true),
      fsLogfile: ()=>FAQStore.reply(client, interaction, 'Uploading your log file', 'You can find `log.txt` in `Documents/My Games/FarmingSimulator2022` and upload it into <#596989522395398144> along with your issue, so people can assist you further and help you resolve.', CDN('log_txt-Location'), true),
      fsDevConsole: ()=>FAQStore.reply(client, interaction, 'Enabling the development console', 'Head over to `game.xml` in `Documents/My Games/FarmingSimulator2022` and find the section that mentions `<controls>false</controls>` inside development section, change it to `true` then you are good to go!\nFYI: The keybind to open console is \``\u200b\` (backtick).', CDN('enableDevConsole'), true)
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
