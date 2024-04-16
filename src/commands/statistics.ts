import Discord from 'discord.js';
import TClient from '../client.js';
import Formatters from '../helpers/Formatters.js';
import MessageTool from '../helpers/MessageTool.js';
import GitHub from '../helpers/GitHub.js';
import si from 'systeminformation';
import os from 'node:os';
import ts from 'typescript';
import {readFileSync, existsSync} from 'node:fs';
export default class Statistics {
  static async run(client:TClient, interaction:Discord.ChatInputCommandInteraction<'cached'>) {
    const initialMsg = await interaction.reply({content: '<a:sakjdfsajkfhsdjhjfsa:1065342869428252743>', fetchReply:true});
    const repoData = await GitHub.LocalRepository();
    const embed = new client.embed().setColor(client.config.embedColor).setTitle('Statistics').setDescription(MessageTool.concatMessage(
      'This is a list of commands ordered by their uses in the current bot uptime.',
      'Underneath is a list of main dependencies as well as the bot/host information.'
    ));
    const systemInfo = {
      cpu: await si.cpu(),
      mem: await si.mem(),
      osInfo: await si.osInfo(),
      currLoad: await si.currentLoad()
    };

    const col = ['Command', 'Uses'];
    const cmdUses = client.commands.filter(x=>x.uses).sort((a,b)=>b.uses - a.uses);

    const nameLen = Math.max(...cmdUses.map(x=>x.command.data.name.length), col[0].length) + 2;
    const usesLen = Math.max(...cmdUses.map(x=>x.uses.toString().length), col[1].length) + 1;

    const rows = [`${col[0].padEnd(nameLen)}${col[1].padStart(usesLen)}\n`, '־'.repeat(nameLen + usesLen) + '\n'];
    cmdUses.forEach(cmd=>{
      const name = cmd.command.data.name;
      const uses = cmd.uses.toString();
      rows.push(`${name.padEnd(nameLen)}${uses.padStart(usesLen)}\n`);
    });

    const fieldChunks = [];
    let field = '';
    rows.forEach(r=>{
      if (field.length+r.length > 1024) {
        fieldChunks.push(field);
        field = r;
      } else field += r;
    });
    fieldChunks.push(field);
    fieldChunks.forEach(field=>embed.addFields({name: '\u200b', value: `\`\`\`\n${field}\`\`\``}));

    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    embed.addFields(
      {name: '🔹 *Dependencies*', value: MessageTool.concatMessage(
        `>>> **Yarn:** ${pkg.packageManager.split('@')[1].split('+')[0]}`,
        `**Node.js:** ${process.version.slice(1)}`,
        `**Discord.js:** ${pkg.dependencies['discord.js']}`,
        `**TypeScript:** ${ts.version}`,
        `**TokenService:** ${pkg.dependencies['@toast/tokenservice-client']}`,
        `**Sequelize:** ${pkg.dependencies['@sequelize/core']}`,
        `**Redis:** ${pkg.dependencies.redis}`
      )},
      {name: '🔹 *Host*', value: MessageTool.concatMessage(
        `>>> **OS:** ${systemInfo.osInfo.distro} ${systemInfo.osInfo.release}`,
        `**CPU:** ${systemInfo.cpu.manufacturer} ${systemInfo.cpu.brand} ${this.isHostVirtualized() ? '' : `∙ ${systemInfo.cpu.speed} GHz`}`,
        '**RAM**',
        `╰ **Host:** ${this.progressBar(systemInfo.mem.used, systemInfo.mem.total)} (${Formatters.byteFormat(systemInfo.mem.used)}/${Formatters.byteFormat(systemInfo.mem.total)})`,
        `╰ **Bot:** ${this.progressBar(process.memoryUsage().heapUsed, process.memoryUsage().heapTotal)} (${Formatters.byteFormat(process.memoryUsage().heapUsed)}/${Formatters.byteFormat(process.memoryUsage().heapTotal)})`,
        '**Uptime**',
        `╰ **Host:** ${Formatters.timeFormat(os.uptime()*1000, 3, {longNames: true, commas: true})}`,
        `╰ **Bot:** ${Formatters.timeFormat(process.uptime()*1000, 3, {longNames: true, commas: true})}`,
        '**Load Usage**',
        `╰ **User:** ${this.progressBar(systemInfo.currLoad.currentLoadUser, 100)} (${systemInfo.currLoad.currentLoadUser.toFixed(2)}%)`,
        `╰ **Sys:** ${this.progressBar(systemInfo.currLoad.currentLoadSystem, 100)} (${systemInfo.currLoad.currentLoadSystem.toFixed(2)}%)`
      )}
    ).setFooter({text: `Version: ${repoData.hash.slice(0,7)} ∙ ${repoData.message}`});
    initialMsg.edit({content: null, embeds: [embed]});
  }
  private static progressBar(used:number, total:number):string {
    const length:number = 10;
    const percent = used/total;
    const bar = '▓'.repeat(Math.round(percent*length)) + '░'.repeat(length-Math.round(percent*length));
    return `${bar} ${Math.round(percent*100)}%`;
  }
  private static isHostVirtualized():boolean {
    if (existsSync('/sys/firmware/qemu_fw_cfg') ?? existsSync('/sys/module/qemu_fw_cfg')) return true
    return false;
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('statistics')
    .setDescription('List of commands used in current session and host statistics')
}
