import Discord,{ActionRowBuilder,ButtonBuilder} from 'discord.js';
import { TClient  } from 'src/client';
let msg;
function helpPage(pageNumber: number, client: TClient, message: Discord.Message<boolean>, args: any, toEdit = false){
    async function onEnd(msg){
        await msg.edit({content: '_Removed to save space._', embeds: [], components: []});
    };
    let pageIndex = pageNumber || 0;
    const pageInfo = client.commandPages[pageIndex];
    let text = '';
    client.commands.filter(command=>!command.hidden && command.category === pageInfo.category && command.page === pageInfo.page).forEach(command=>{
        text += client.commandInfo(client, command, client.helpDefaultOptions);
    });
    const embed = new client.embed().setColor(client.config.embedColor).setTitle(`__Commands: ${pageInfo.name}__`).setDescription(text);
    if (toEdit){
        return embed;
    } else {
        message.reply({embeds: [embed], fetchReply: true, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle('Secondary').setCustomId('back').setEmoji('◀'), new ButtonBuilder().setStyle('Secondary').setCustomId('forward').setEmoji('▶'))]})
        // add buttons to go forward or backwards
        .then(async botMessage=>{
            let endTimestamp = Date.now()+90000;
            const filter = (interaction: Discord.ChatInputCommandInteraction)=>{
                return message.author.id === interaction.user.id;
            };
            const collector = botMessage.createMessageComponentCollector({filter, time: 90000});;
            collector.on('collect', async(button: Discord.ButtonInteraction)=>{
                endTimestamp = Date.now()+60000;
                if (button.customId === 'back'){
                    if (pageIndex - 1<0) pageIndex = client.commandPages.length;
                    pageIndex--;
                    button.update({embeds: [helpPage(pageIndex, client, message, args, true)]})
                } else if (button.customId === 'forward'){
                    if (pageIndex + 1>=client.commandPages.length) pageIndex = -1;
                    pageIndex++;
                    button.update({embeds: [helpPage(pageIndex, client, message, args, true)]})
                }
            });
            async function onEnd(){
                await botMessage.edit({content: '_Removed to save space._', embeds: [], components: []})
            }
            const interval = setInterval(()=>{
                if (Date.now()>endTimestamp){
                    collector.stop();
                    onEnd();
                }
            },5000);
            collector.on('end', async()=>{
                onEnd();
                clearInterval(interval)
            })
        })
    }
}
export default {
    async run(client: TClient, message: Discord.Message, args: any){
        // if they ask for specific page #
        if (parseInt(args[1])){
            if (!client.commandPages[parseInt(args[1]) - 1]) return message.reply('That page number doesn\'t exist.');
            return helpPage(parseInt(args[1]) - 1, client, message, args);
        }
        // category (name)
        if (client.commandPages.some(x=>x.category.toLowerCase() === args.slice(1).join(' ').toLowerCase())){
            return helpPage(client.commandPages.map(x=>x.category.toLowerCase()).indexOf(args.slice(1).join(' ').toLowerCase()), client, message, args)
        }
        // or command (name)
        const command = client.commands.find(x=>x.name === args[1] || x.alias?.includes(args[1]));
        if (command){
            const embed = new client.embed().setColor(client.config.embedColor).setTitle(`__Commands: ${command.name}__`).setDescription(client.commandInfo(client, command, {insertNewline: true, parts: ['name', 'usage', 'description', 'shortDescription', 'alias', 'category', 'autores'], titles: ['name', 'usage', 'shortDescription', 'alias', 'category', 'autores']}));
        return message.reply({embeds: [embed]});
        }
        // if run() still hasnt been returned, send category 0 page 1
        return helpPage(undefined, client, message, args);
    },
    name: 'help',
    description: 'Command information and their usage.',
    usage: ['?command / ?category / ?page'],
    category: 'bot'
}