import Discord from 'discord.js';
import pkg from 'typescript';
import MessageTool from '../helpers/MessageTool.js';
import FormatBytes from '../helpers/FormatBytes.js';
import FormatTime from '../helpers/FormatTime.js';
import si from 'systeminformation';
import TClient from '../client.js';
import os from 'node:os';
import {readFileSync} from 'node:fs';
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    const waitForData = await interaction.reply({content: '<a:sakjdfsajkfhsdjhjfsa:1065342869428252743>', fetchReply:true})
    const cpu = await si.cpu();
    const ram = await si.mem();
    const osInfo = await si.osInfo();
    const currentLoad = await si.currentLoad();

    const columns = ['Command name', 'Count'];
    const includedCommands = client.commands.filter(x=>x.uses).sort((a,b)=>b.uses - a.uses);
    if (includedCommands.size === 0) return interaction.reply(`No commands have been used yet.\nUptime: **${FormatTime(client.uptime, 3, {longNames: true, commas: true})}**`);
    const nameLength = Math.max(...includedCommands.map(x=>x.command.default.data.name.length), columns[0].length) + 2;
    const amountLength = Math.max(...includedCommands.map(x=>x.uses.toString().length), columns[1].length) + 1;
    const rows = [`${columns[0] + ' '.repeat(nameLength - columns[0].length)}|${' '.repeat(amountLength - columns[1].length) + columns[1]}\n`, '-'.repeat(nameLength) + '-'.repeat(amountLength) + '\n'];
    includedCommands.forEach(command=>{
      const name = command.command.default.data.name;
      const count = command.uses.toString();
      rows.push(`${name + ' '.repeat(nameLength - name.length)}${' '.repeat(amountLength - count.length) + count}\n`);
    });
    const embed = new client.embed().setColor(client.config.embedColor).setTitle('Statistics: Command Usage')
    .setDescription(MessageTool.concatMessage(
      'List of commands that have been used in this session, ordered by amount of use. Table contains command name and amount of uses.',
      `Total amount of commands used in this session: ${client.commands.filter(x=>x.uses).map(x=>x.uses).reduce((a,b)=>a+b, 0)}`
    ));
    if (rows.join('').length > 1024){
      let fieldValue = '';
      rows.forEach(row=>{
        if (fieldValue.length + row.length > 1024){
          embed.addFields({name: '\u200b', value: `\`\`\`\n${fieldValue}\`\`\``});
          fieldValue = row;
        } else fieldValue += row
      });
      embed.addFields({name: '\u200b', value: `\`\`\`\n${fieldValue}\`\`\``});
    } else embed.addFields({name: '\u200b', value: `\`\`\`\n${rows.join('')}\`\`\``});
    embed.addFields(
      {name: '> __Dependencies__', value: MessageTool.concatMessage(
        `**TypeScript:** ${pkg.version}`,
        `**NodeJS:** ${process.version}`,
        `**DiscordJS:** ${Discord.version}`,
        `**Yarn:** ${packageJson.packageManager.slice(5)}`
      )},
      {name: '> __Host__', value: MessageTool.concatMessage(
        `**Operating System:** ${osInfo.distro + ' ' + osInfo.release}`,
        `**CPU:** ${cpu.manufacturer} ${cpu.brand}`,
        `**Memory:** ${FormatBytes(ram.used)}/${FormatBytes(ram.total)}`,
        `**Process:** ${FormatBytes(process.memoryUsage().heapUsed)}/${FormatBytes(process.memoryUsage().heapTotal)}`,
        `**Load Usage:**\nUser: ${currentLoad.currentLoadUser.toFixed(1)}%\nSystem: ${currentLoad.currentLoadSystem.toFixed(1)}%`,
        `**Uptime:**\nHost: ${FormatTime((os.uptime()*1000), 2, {longNames: true, commas: true})}\nBot: ${FormatTime(client.uptime, 2, {commas: true, longNames: true})}`
      )}
    );
    waitForData.edit({content:null,embeds:[embed]}).then(x=>x.edit({embeds:[new client.embed(x.embeds[0].data).setFooter({text: `Load time: ${FormatTime(x.createdTimestamp - interaction.createdTimestamp, 2, {longNames: true, commas: true})}`})]}))  
  },
  data: new Discord.SlashCommandBuilder()
    .setName('statistics')
    .setDescription('See a list of commands ordered by their usage or host stats')
}