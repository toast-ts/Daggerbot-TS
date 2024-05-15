import Discord from 'discord.js';
import MessageTool from './MessageTool.js';
import ConfigHelper from './ConfigHelper.js';
const config = ConfigHelper.readConfig();
export default class FAQHelper {
  private static readonly errorMsg:string = 'Failed to send the message, please report to **Toast** if it continues.';
  private static ansiCodeblock=(...lines:string[])=>MessageTool.concatMessage('```ansi', ...lines, '```')
  public static async reply(interaction:Discord.ChatInputCommandInteraction, title:string|null, message:string, image:string|null, useEmbed:boolean=false) {
    if (useEmbed) return interaction.reply({embeds: [MessageTool.embedStruct(config.embedColor, title, message, image)]}).catch(err=>interaction.reply(this.errorMsg+'\n'+err))
    else return interaction.reply(message).catch(err=>interaction.reply(this.errorMsg+'\n'+err))
  }
  public static CDN=(filename:string)=>'https://cdn.toast-server.net/daggerwin/'+filename+'.png';
  public static youCanGetRole=(role:string, roleEmoji:string)=>`You can get the ${MessageTool.formatMention(config.dcServer.roles[role], 'role')} role from <#802283932430106624> by clicking :${roleEmoji}: on a webhook's message.`;
  public static readonly verifyGameFiles = this.ansiCodeblock(
    '[34m[1mSteam[0m (Top panel)',
    '1. Go to your game library and right click on Farming Simulator 22',
    '2. Click on Properties and navigate to "Installed Files"',
    '3. Click on "Verify integrity of game files"',
    '4. Steam will scan your game installation directory and will re-download anything that is corrupted or tampered with.',
    '',
    '[37m[1mEpic Games[0m (Bottom panel)',
    '1. Go to your game library and click on 3 dots (...)',
    '2. Click on Manage and click on "Verify"',
    '3. Epic Launcher will scan your game installation directory and will re-download anything that is corrupted or tampered with.'
  )
  public static readonly linkMapping = {
    ballyspring: 'https://www.farming-simulator.com/mod.php?mod_id=270745',
    discordModTicket: 'https://discord.com/channels/468835415093411861/942173932339986472/1054129985788596385',
    vtcPaintjob: 'https://discord.com/channels/468835415093411861/801975222609641472/1165673285460164739'
  }
}
