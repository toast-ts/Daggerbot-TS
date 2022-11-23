import Discord,{SlashCommandBuilder} from 'discord.js';
import { TClient } from 'src/client';
import { UserLevels } from 'src/typings/interfaces';
export default {
    async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
        if (interaction.guildId !== client.config.mainServer.id) return interaction.reply({content: 'This command doesn\'t work in this server.', ephemeral: true});
        const subCmd = interaction.options.getSubcommand();

		if (subCmd === "leaderboard") {
			const messageCountsTotal = Object.values<UserLevels>(client.userLevels._content).reduce((a, b) => a + b.messages, 0);
			const timeActive = Math.floor((Date.now() - client.config.LRSstart)/1000/60/60/24);

			const data = require('../database/dailyMsgs.json').map((x: Array<number>, i: number, a: any) => {
				const yesterday = a[i - 1] || [];
				return x[1] - (yesterday[1] || x[1]);
			}).slice(1).slice(-60);
			
			// handle negative days
			data.forEach((change: number, i: number) => {
				if (change < 0) data[i] = data[i - 1] || data[i + 1] || 0;
			});
			
			const maxValue = Math.max(...data);
			const maxValueArr = maxValue.toString().split('');
			
			const first_graph_top = Math.ceil(maxValue * 10 ** (-maxValueArr.length + 1)) * 10 ** (maxValueArr.length - 1);
			// console.log({ first_graph_top });
			
			const second_graph_top = Math.ceil(maxValue * 10 ** (-maxValueArr.length + 2)) * 10 ** (maxValueArr.length - 2);
			// console.log({ second_graph_top });
			
			const textSize = 32;
			
			const canvas = require('canvas');
			const img = canvas.createCanvas(950, 450);
			const ctx = img.getContext('2d');
			
			const graphOrigin = [10, 50];
			const graphSize = [700, 360];
			const nodeWidth = graphSize[0] / (data.length - 1);
			ctx.fillStyle = '#36393f';
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
			// console.log({ interval_candidates });
			const chosen_interval = interval_candidates.sort((a, b) => b[2] - a[2])[0];
			// console.log({ chosen_interval });
			
			let previousY: Array<number> = [];
			
			ctx.strokeStyle = '#202225';
			for (let i = 0; i <= chosen_interval[1]; i++) {
				const y = graphOrigin[1] + graphSize[1] - (i * (chosen_interval[0] / second_graph_top) * graphSize[1]);
				if (y < graphOrigin[1]) continue;
				const even = ((i + 1) % 2) === 0;
				if (even) ctx.strokeStyle = '#2c2f33';
				ctx.beginPath();
				ctx.lineTo(graphOrigin[0], y);
				ctx.lineTo(graphOrigin[0] + graphSize[0], y);
				ctx.stroke();
				ctx.closePath();
				if (even) ctx.strokeStyle = '#202225';
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
			ctx.strokeStyle = client.config.embedColor;
			ctx.fillStyle = client.config.embedColor;
			ctx.lineWidth = 3;
			
			
			function getYCoordinate(value: number) {
				return ((1 - (value / second_graph_top)) * graphSize[1]) + graphOrigin[1];
			}
			
			let lastCoords: Array<number> = [];
			data.forEach((val: number, i: number) => {
				ctx.beginPath();
				if (lastCoords) ctx.moveTo(...lastCoords);
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
			//console.log(previousY)
			const maxx = graphOrigin[0] + graphSize[0] + textSize;
			const maxy = previousY[0] + (textSize / 3);
			ctx.fillText(previousY[1].toLocaleString('en-US'), maxx, maxy);
			
			// lowest value
			const lowx = graphOrigin[0] + graphSize[0] + textSize;
			const lowy = graphOrigin[1] + graphSize[1] + (textSize / 3);
			ctx.fillText('0 msgs/day', lowx, lowy);
			
			// 30d
			ctx.fillText('30d ago', lastMonthStart, graphOrigin[1] - (textSize / 3));
			
			// time ->
			const tx = graphOrigin[0] + (textSize / 2);
			const ty = graphOrigin[1] + graphSize[1] + (textSize);
			ctx.fillText('time ->', tx, ty);
			
			const yeahok = new client.attachmentBuilder(img.toBuffer(), {name: "dailymsgs.png"})
			const embed = new client.embed()
				.setTitle('Ranking leaderboard')
				.setDescription(`Level System was created **${timeActive}** days ago. Since then, a total of **${messageCountsTotal.toLocaleString('en-US')}** messages have been sent in this server.`)
				.addFields({name: 'Top users by messages sent:', value: Object.entries<UserLevels>(client.userLevels._content).sort((a, b) => b[1].messages - a[1].messages).slice(0, 10).map((x, i) => `\`${i + 1}.\` <@${x[0]}>: ${x[1].messages.toLocaleString('en-US')}`).join('\n')})
				.setImage('attachment://dailymsgs.png')
				.setColor(client.config.embedColor)
			interaction.reply({embeds: [embed], files: [yeahok]});
			return;
		} else if (subCmd === "view") {
			// fetch user or user interaction sender
			const member = interaction.options.getMember("member") ?? interaction.member as Discord.GuildMember;
			if (member.user.bot) return interaction.reply('Bots don\'t level up, try viewing non-bots instead.')
			const embed = new client.embed().setColor(member.displayColor)
			// information about users progress on level roles
			const information = client.userLevels._content[member.user.id];
			const pronounBool = (you: string, they: string) => { // takes 2 words and chooses which to use based on if user did this command on themself
				if (interaction.user.id === member.user.id) return you || true;
				else return they || false;
			};
			if (!information) {
				return interaction.reply(`${pronounBool('You', 'They')} currently don't have a level, send some messages to level up.`)
			}
			const index = Object.entries<UserLevels>(client.userLevels._content).sort((a, b) => b[1].messages - a[1].messages).map(x => x[0]).indexOf(member.id) + 1;
			const suffix = ((index)=>{
				const numbers = index.toString().split('').reverse(); //eg. 1850 -> [0,5,8,1]
				if (numbers[1] == '1'){//this some -teen
					return 'th';
				}else{
					if (numbers[0] == '1') return 'st';
					else if (numbers[0] == '2') return 'nd';
					else if (numbers[0] == '3') return 'rd';
					else return 'th';
				}
			})(index);
			const memberDifference = information.messages - client.userLevels.algorithm(information.level);
			const levelDifference = client.userLevels.algorithm(information.level+1) - client.userLevels.algorithm(information.level);

			embed.setThumbnail(member.user.avatarURL({ extension: 'png', size: 256}) || member.user.defaultAvatarURL).setAuthor({name: `Ranking for ${member.user.tag}`}).setFooter({text: `You're ${index ? index + suffix : 'last'} in a leaderboard, ordered by their message count.`})
			.setTitle(`Level: **${information.level}**\nRank: **${index ? '#' + index  : 'last'}**\nProgress: **${information.messages - client.userLevels.algorithm(information.level)}/${client.userLevels.algorithm(information.level+1) - client.userLevels.algorithm(information.level)} (${(memberDifference/levelDifference*100).toFixed(2)}%)**\nTotal: **${information.messages}**`);
			interaction.reply({embeds: [embed]});
	 	}
    },
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Level system')
        .addSubcommand((optt)=>optt
            .setName('view')
            .setDescription('View your rank or someone else\'s rank')
            .addUserOption((opt)=>opt
                .setName('member')
                .setDescription('Which member do you want to view?')))
        .addSubcommand((optt)=>optt
            .setName('leaderboard')
            .setDescription('View top 10 users on leaderboard'))
}