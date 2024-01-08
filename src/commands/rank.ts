import Discord from 'discord.js';
import TClient from '../client.js';
import MessageTool from '../helpers/MessageTool.js';
import CanvasBuilder from '../components/CanvasGraph.js';
export default class Rank {
  static async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (interaction.guildId !== client.config.dcServer.id) return interaction.reply({content: 'This command doesn\'t work in this server.', ephemeral: true});
    const allData = await client.userLevels.fetchEveryone();
    ({
      view: async()=>{
      	const member = interaction.options.getMember('member') ?? interaction.member as Discord.GuildMember;
      	if (member.user.bot) return interaction.reply('Bots don\'t level up, try again with an actual member instead.');
        const userData = await client.userLevels.fetchUser(member.user.id);

        const pronounBool = (you: string, they: string) => { // takes 2 words and chooses which to use based on if user did this command on themselves
        	if (interaction.user.id === member.user.id) return you || true;
        	else return they || false;
        };
        if (!userData) return interaction.reply(`${pronounBool('You', 'They')} currently don't have a level, send some messages to level up.`)

			  const index = allData.sort((a, b) => b.messages - a.messages).map(x=>x.dataValues.id).indexOf(member.id) + 1;
			  const memberDifference = userData.dataValues.messages - client.userLevels.algorithm(userData.dataValues.level);
			  const levelDifference = client.userLevels.algorithm(userData.dataValues.level+1) - client.userLevels.algorithm(userData.dataValues.level);
        let ptText = 'Ping toggle ';
        interaction.reply({embeds: [new client.embed().setColor(member.displayColor).setTitle(`Level: **${userData.dataValues.level}**\nRank: **${index ? '#' + index  : 'last'}**\nProgress: **${memberDifference}/${levelDifference} (${(memberDifference/levelDifference*100).toFixed(2)}%)**\nTotal: **${userData.dataValues.messages.toLocaleString('en-US')}**`).setThumbnail(member.avatarURL({extension:'png',size:1024}) || member.user.avatarURL({extension:'png',size:1024}) || member.user.defaultAvatarURL).setFooter({text: userData.pingToggle === true ? ptText += 'enabled' : ptText += 'disabled'})]})
			},
			leaderboard: async()=>{
        const data = (await client.dailyMsgs.fetchDays()).map(x=>[x.dataValues.day, x.dataValues.total]).sort((a,b)=>a[0]-b[0]).slice(-60).map((x: number[], i: number, a: any)=>{
          return x[1] - ((a[i - 1] || [])[1] || x[1])
        });
        if (data.length < 2) return interaction.reply('Not enough data to generate graph.');

        const graph = await new CanvasBuilder().generateGraph(data, 'leaderboard');
			  interaction.reply({
          embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Leaderboard')
          .setDescription(MessageTool.concatMessage(
            `Level System was created **${Math.floor((Date.now()-client.config.LRSstart)/1000/60/60/24)}** days ago.`,
            `Since then, a total of **${allData.reduce((a, b)=>a+b.messages, 0).toLocaleString('en-US')}** messages have been sent in this server.`
          )).addFields({
            name: 'Top users sorted by messages sent:',
            value: allData.sort((a,b)=>b.messages - a.messages).slice(0,15).map((x,i)=>`${i+1}. <@${x.dataValues.id}>: ${x.messages.toLocaleString('en-US')}`).join('\n')
          }).setImage('attachment://dailyMessages.jpg').setFooter({text: 'Graph updates daily'})],
          files: [new client.attachment(graph.toBuffer(), {name: 'dailyMessages.jpg'})]
        })
			},
      notification: async()=>{
        const findUserInDatabase = await client.userLevels.fetchUser(interaction.user.id);
        const textDeco = 'be pinged for level-up notifications.'
        if (!findUserInDatabase.pingToggle) {
          await findUserInDatabase.update({pingToggle: true}, {where: {id: interaction.user.id}})
          interaction.reply({content: 'You will '+textDeco, ephemeral: true})
        } else if (findUserInDatabase.pingToggle) {
          await findUserInDatabase.update({pingToggle: false}, {where: {id: interaction.user.id}})
          interaction.reply({content: 'You won\'t '+textDeco, ephemeral: true})
        }
      }
		} as any)[interaction.options.getSubcommand()]();
  }
  static data = new Discord.SlashCommandBuilder()
    .setName('rank')
    .setDescription('Level system')
    .addSubcommand(x=>x
      .setName('view')
      .setDescription('View your rank or someone else\'s rank')
      .addUserOption(x=>x
        .setName('member')
        .setDescription('Which member do you want to view?')))
    .addSubcommand(x=>x
      .setName('leaderboard')
      .setDescription('View top 15 users on leaderboard'))
    .addSubcommand(x=>x
      .setName('notification')
      .setDescription('Allow the bot to ping you or not when you level up'))
}
