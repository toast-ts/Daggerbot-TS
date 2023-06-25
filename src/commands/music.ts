import Discord from 'discord.js';
import TClient from '../client.js';
import {Player,useTimeline,useQueue} from 'discord-player';
import {SpotifyExtractor} from '@discord-player/extractor';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!client.config.botSwitches.music) return interaction.reply({content:'Music module is currently disabled.',ephemeral:true});
    if (!client.isStaff(interaction.member) && !client.config.whitelist.includes(interaction.member.id)) return interaction.reply('This command is in early stages of development, some parts may be missing or broken.\nIt has been restricted to staff for time-being.');
    const player = Player.singleton(client);
    await player.extractors.register(SpotifyExtractor, {
      clientId: client.tokens.dontlookatme.client,
      clientSecret: client.tokens.dontlookatme.secret
    });
    const voiceCh = interaction.member.voice.channel;
    if (!voiceCh) return interaction.reply('Please join a voice channel first to use the command.');
    player.nodes.create(interaction.guildId, {
      metadata: {
        channel: interaction.channel,
        client: interaction.guild.members.me,
        requestedBy: interaction.member
      },
      selfDeaf: true,
      volume: 75,
      skipOnNoStream: true, 
      leaveOnEnd: false,
      leaveOnEmpty: false,
      bufferingTimeout: 30000,
      connectionTimeout: 25000,
      strategy: 'FIFO'
    });
    ({
      play: async()=>{
        const url = interaction.options.getString('url');
        if (!url.includes('https://open.spotify.com/')) return interaction.reply('Sorry, I can\'t play that. I can only accept Spotify links that contains `https://open.spotify.com/`');
        player.play(interaction.member.voice.channel, url);
        await interaction.reply(`Added the song to the queue.`);
      },
      stop: async()=>{
        player.destroy();
        await interaction.reply('Player destroyed.')
      },
      now_playing: ()=>{
        const {volume,timestamp,track} = useTimeline(interaction.guildId);
        interaction.reply({embeds:[
          new client.embed().setColor(client.config.embedColor).setTitle(`${track.title} - ${track.author}`).setThumbnail(track.thumbnail).addFields(
            {name: 'Timestamp', value: `**${timestamp.current.label}**/**${timestamp.total.label}**`, inline: true},
            {name: 'Volume', value: `${volume}%`, inline: true}
          )
        ]})
      },
      volume: ()=>{
        const vol = interaction.options.getNumber('percentage');
        const queue = useQueue(interaction.guildId);
        queue.node.setVolume(vol);
        interaction.reply(`Successfully adjusted the player's volume to ${vol}%`)
      }
    } as any)[interaction.options.getSubcommand()]();
  },
  data: new Discord.SlashCommandBuilder()
    .setName('music')
    .setDescription('Music module')
    .addSubcommand(x=>x
      .setName('play')
      .setDescription('Play a Spotify song')
      .addStringOption(x=>x
        .setName('url')
        .setDescription('Spotify URL')
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('stop')
      .setDescription('Stop playing music and disconnect the bot from voice channel'))
    .addSubcommand(x=>x
      .setName('now_playing')
      .setDescription('Check what song is currently playing'))
    .addSubcommand(x=>x
      .setName('volume')
      .setDescription('Adjust the player\'s volume')
      .addNumberOption(x=>x
        .setName('percentage')
        .setDescription('Volume level to adjust, ranges from 5 to 100, default is 75')
        .setMaxValue(100)
        .setMinValue(5)
        .setRequired(true)))
}