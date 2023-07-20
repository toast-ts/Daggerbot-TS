import Discord from 'discord.js';
import TClient from '../client.js';
import path from 'node:path';
import {readFileSync} from 'node:fs';
import canvas from 'canvas';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (interaction.guildId !== client.config.mainServer.id) return interaction.reply({content: 'This command doesn\'t work in this server.', ephemeral: true});
    const allData = await client.userLevels._content.find({});
    ({
      view: async()=>{
      	// fetch user or user interaction sender
      	const member = interaction.options.getMember('member') ?? interaction.member as Discord.GuildMember;
      	if (member.user.bot) return interaction.reply('Bots don\'t level up, try viewing the rank data from the users instead.');
      	// information about users progress on level roles
      	const userData = await client.userLevels._content.findById(member.user.id);

        const pronounBool = (you: string, they: string) => { // takes 2 words and chooses which to use based on if user did this command on themself
        	if (interaction.user.id === member.user.id) return you || true;
        	else return they || false;
        };
        if (!userData) return interaction.reply(`${pronounBool('You', 'They')} currently don't have a level, send some messages to level up.`)

			  const index = allData.sort((a, b) => b.messages - a.messages).map(x => x._id).indexOf(member.id) + 1;
			  const memberDifference = userData.messages - client.userLevels.algorithm(userData.level);
			  const levelDifference = client.userLevels.algorithm(userData.level+1) - client.userLevels.algorithm(userData.level);
        interaction.reply({embeds: [new client.embed().setColor(member.displayColor).setTitle(`Level: **${userData.level}**\nRank: **${index ? '#' + index  : 'last'}**\nProgress: **${memberDifference}/${levelDifference} (${(memberDifference/levelDifference*100).toFixed(2)}%)**\nTotal: **${userData.messages.toLocaleString('en-US')}**`).setThumbnail(member.avatarURL({extension:'png',size:1024}) || member.user.avatarURL({extension:'png',size:1024}) || member.user.defaultAvatarURL).setFooter({text: userData.notificationPing === true ? 'Ping notification enabled' : 'Ping notification disabled'})]})
			},
			leaderboard: ()=>{
        const data = JSON.parse(readFileSync(path.join('./src/database/dailyMsgs.json'), 'utf8')).map((x: Array<number>, i: number, a: any) => {
          return x[1] - ((a[i - 1] || [])[1] || x[1])
				}).slice(1).slice(-60);

				// handle negative days
				data.forEach((change: number, i: number) => {
					if (change < 0) data[i] = data[i - 1] || data[i + 1] || 0;
				});

				const maxValue = Math.max(...data);
				const maxValueArr = maxValue.toString().split('');

				const first_graph_top = Math.ceil(maxValue * 10 ** (-maxValueArr.length + 1)) * 10 ** (maxValueArr.length - 1);
				const second_graph_top = Math.ceil(maxValue * 10 ** (-maxValueArr.length + 2)) * 10 ** (maxValueArr.length - 2);
				const textSize = 32;

				const img = canvas.createCanvas(1200, 600);
				const ctx = img.getContext('2d');

				const graphOrigin = [25, 50];
				const graphSize = [1020, 500];
				const nodeWidth = graphSize[0] / (data.length - 1);
				ctx.fillStyle = '#36393f'; //'#111111';
				ctx.fillRect(0, 0, img.width, img.height);

				// grey horizontal lines
				ctx.lineWidth = 3;

				let interval_candidates = [];
				for (let i = 4; i < 10; i++) {
					const interval = first_graph_top / i;
					if (Number.isInteger(interval)) {
						let intervalString = interval.toString();
						const reference_number = i * Math.max(intervalString.split('').filter(x => x === '0').length / intervalString.length, 0.3) * (['1', '2', '4', '5', '6', '8'].includes(intervalString[0]) ? 1.5 : 0.67)
						interval_candidates.push([interval, i, reference_number]);
					}
				}
				const chosen_interval = interval_candidates.sort((a, b) => b[2] - a[2])[0];
				let previousY: Array<number> = [];

			  ctx.strokeStyle = '#202225'; //'#555B63';
			  for (let i = 0; i <= chosen_interval[1]; i++) {
			  	const y = graphOrigin[1] + graphSize[1] - (i * (chosen_interval[0] / second_graph_top) * graphSize[1]);
			  	if (y < graphOrigin[1]) continue;
			  	const even = ((i + 1) % 2) === 0;
			  	if (even) ctx.strokeStyle = '#2c2f33'; //'#3E4245';
			  	ctx.beginPath();
			  	ctx.lineTo(graphOrigin[0], y);
			  	ctx.lineTo(graphOrigin[0] + graphSize[0], y);
			  	ctx.stroke();
			  	ctx.closePath();
			  	if (even) ctx.strokeStyle = '#202225'; //'#555B63';
			  	previousY = [y, i * chosen_interval[0]];
			  }

			  // 30d mark
			  ctx.setLineDash([8, 16]);
			  ctx.beginPath();
			  const lastMonthStart = graphOrigin[0] + (nodeWidth * (data.length - 30));
			  ctx.lineTo(lastMonthStart, graphOrigin[1]);
			  ctx.lineTo(lastMonthStart, graphOrigin[1] + graphSize[1]);
			  ctx.stroke();
			  ctx.closePath();
			  ctx.setLineDash([]);

		    // draw points
		    ctx.strokeStyle = client.config.embedColor as string;
		    ctx.fillStyle = client.config.embedColor as string;
		    ctx.lineWidth = 4;

			  function getYCoordinate(value: number) {
			    return ((1 - (value / second_graph_top)) * graphSize[1]) + graphOrigin[1];
			  }

			  let lastCoords: Array<number> = [];
			  data.forEach((val: number, i: number) => {
			  	ctx.beginPath();
			  	if (lastCoords) ctx.moveTo(lastCoords[0], lastCoords[1]);
			  	if (val < 0) val = 0;
			  	const x = i * nodeWidth + graphOrigin[0];
			  	const y = getYCoordinate(val);
			  	ctx.lineTo(x, y);
			  	lastCoords = [x, y];
			  	ctx.stroke();
			  	ctx.closePath();

			   	// ball
			   	ctx.beginPath();
			   	ctx.arc(x, y, ctx.lineWidth * 1.2, 0, 2 * Math.PI)
			   	ctx.closePath();
			   	ctx.fill();
			  });

			  // draw text
			  ctx.font = '400 ' + textSize + 'px sans-serif';
			  ctx.fillStyle = 'white';

			  // highest value
			  ctx.fillText(previousY[1].toLocaleString('en-US'), graphOrigin[0] + graphSize[0] + textSize, previousY[0] + (textSize / 3));

			  // lowest value
			  ctx.fillText('0 msgs', graphOrigin[0] + graphSize[0] + textSize, graphOrigin[1] + graphSize[1] + (textSize / 3));

			  // 30d
			  ctx.fillText('30d ago', lastMonthStart, graphOrigin[1] - (textSize / 3));

			  // time ->
			  ctx.fillText('time ->', graphOrigin[0] + (textSize / 2), graphOrigin[1] + graphSize[1] + (textSize));

			  interaction.reply({embeds: [
          new client.embed().setTitle('Ranking leaderboard')
			    .setDescription(`Level System was created **${Math.floor((Date.now()-client.config.LRSstart)/1000/60/60/24)}** days ago. Since then, a total of **${allData.reduce((a, b)=>a+b.messages, 0).toLocaleString('en-US')}** messages have been sent in this server.`)
			    .addFields({name: 'Top users by messages sent:', value: allData.sort((a,b)=>b.messages - a.messages).slice(0,10).map((x,i)=>`${i+1}. <@${x._id}>: ${x.messages.toLocaleString('en-US')}`).join('\n')})
          .setImage('attachment://dailymsgs.png').setColor(client.config.embedColor)
			   	.setFooter({text: 'Graph updates daily.'})
        ], files: [new client.attachmentBuilder(img.toBuffer(),{name: 'dailymsgs.png'})]})
			},
      notification: async()=>{
        const findUserInMongo = await client.userLevels._content.findById(interaction.user.id);
        if (!findUserInMongo.notificationPing ?? findUserInMongo.notificationPing === false) {
          await findUserInMongo.updateOne({_id: interaction.user.id, notificationPing: true})
          interaction.reply({content: 'You will be pinged for level-up notification in the future.', ephemeral: true})
        } else if (findUserInMongo.notificationPing === true) {
          await findUserInMongo.updateOne({_id: interaction.user.id, notificationPing: false})
          interaction.reply({content: 'You won\'t be pinged for level-up notification in the future.', ephemeral: true})
        }
      }
		} as any)[interaction.options.getSubcommand()]();
  },
  data: new Discord.SlashCommandBuilder()
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
      .setDescription('View top 10 users on leaderboard'))
    .addSubcommand(x=>x
      .setName('notification')
      .setDescription('Allow the bot to ping you or not when you level up'))
}