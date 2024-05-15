import Discord from 'discord.js';
import TClient from '../client.js';
import FAQHelper from '../helpers/FAQHelper.js';
export default class FAQ {
  static run(_client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    ({
      srp: ()=>FAQHelper.reply(interaction, null, `[Ballyspring](<${FAQHelper.linkMapping.ballyspring}>) is the map that is used in Survival Roleplay S4.\n\n> ℹ️ __Note__\n> The map won't look closely like the one in SRP as it is privately edited version of the public map.`, null, false),
      vtcR: ()=>interaction.reply(FAQHelper.youCanGetRole('vtcmember', 'truck')+`\n*VTC skin can also be found in the [VTC announcements channel](<${FAQHelper.linkMapping.vtcPaintjob}>).*`),
      mpR: ()=>interaction.reply(FAQHelper.youCanGetRole('mpplayer', 'tractor')),
      ytscam: ()=>FAQHelper.reply(interaction, 'Scammers in YouTube comments section', 'If you ever see a comment mentioning a giveaway or anything else, **it\'s a scam!**\nYou should report it to YouTube and move on or ignore it.\nP.S: They\'re on every channel and not just Daggerwin.', FAQHelper.CDN('YTScam'), true),
      steamscam: ()=>FAQHelper.reply(interaction, 'Steam account report scam', `If you received a DM about this, please report it to Discord Moderators or open a [ticket](${FAQHelper.linkMapping.discordModTicket})`, FAQHelper.CDN('SteamScam'), true),
      fsVerifyGame: ()=>FAQHelper.reply(interaction, 'Verifying your game files', `You can verify your game files if you experience any issues with your game.\n${FAQHelper.verifyGameFiles}`, FAQHelper.CDN('Steam-Epic-VerifyGamesLocation'), true),
      fsShader: ()=>FAQHelper.reply(interaction, 'Clearing your shader cache folder', 'If your game keeps crashing shortly after opening your game, then the shaders might be an issue.\nTo resolve this, you can go to `Documents/My Games/FarmingSimulator2022` and delete the folder called `shader_cache`', FAQHelper.CDN('shader_cache-Location'), true),
      fsLogfile: ()=>FAQHelper.reply(interaction, 'Uploading your log file', 'You can find `log.txt` in `Documents/My Games/FarmingSimulator2022` and upload it into <#596989522395398144> along with your issue, so people can assist you further and help you resolve.', FAQHelper.CDN('log_txt-Location'), true),
      fsDevConsole: ()=>FAQHelper.reply(interaction, 'Enabling the development console', 'Head over to `game.xml` in `Documents/My Games/FarmingSimulator2022` and find the section that mentions `<controls>false</controls>` inside development section, change it to `true` then you are good to go!\nFYI: The keybind to open console is \``\u200b\` (backtick).', FAQHelper.CDN('enableDevConsole'), true)
    } as any)[interaction.options.getString('question', true)]();
  }
  static data = new Discord.SlashCommandBuilder()
  .setName('faq')
  .setDescription('List of questions, e.g; log file for FS, YT Scams and etc.')
  .addStringOption(x=>x
    .setName('question')
    .setDescription('What question do you want answered?')
    .setRequired(true)
    .setChoices(
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
