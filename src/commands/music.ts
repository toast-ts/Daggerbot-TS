import Discord from 'discord.js';
import TClient from '../client.js';
import {Player,useTimeline,useQueue} from 'discord-player';
import {SpotifyExtractor} from '@discord-player/extractor';
export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!client.config.botSwitches.music && !client.config.whitelist.includes(interaction.user.id)) return interaction.reply({content:'Music module is currently disabled.',ephemeral:true});
    if (!client.isStaff(interaction.member) && !client.config.whitelist.includes(interaction.member.id)) return interaction.reply('This command is in early stages of development, some parts may be missing or broken.\nIt has been restricted to staff for time-being.');
    const player = Player.singleton(client);
    await player.extractors.register(SpotifyExtractor, {
      clientId: client.tokens.dontlookatme.client,
      clientSecret: client.tokens.dontlookatme.secret
    });
    if (!interaction.member.voice.channel) return interaction.reply('Please join a voice channel first to use the command.');
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
        await interaction.reply(`Added the ${url.includes('playlist/') ? 'playlist' : 'song'} to the queue.`);
      },
      stop: async()=>{
        player.destroy();
        await interaction.reply('Player destroyed.')
      },
      pause: ()=>{
        const queue = useQueue(interaction.guildId);
        queue.node.setPaused(!queue.node.isPaused());
        if (!queue.node.isPaused) interaction.reply('Music has been paused.');
        else if (queue.node.isPaused) interaction.reply('Music has been unpaused.')
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
      queue: async()=>{
        const queue = useQueue(interaction.guildId);
        await interaction.reply({embeds:[new client.embed().setColor(client.config.embedColor).setTitle(`Songs currently in the queue: ${queue.tracks.size}`).setDescription(queue.tracks.size > 0 ? `${queue.tracks.map(i=>`**${i.title}** - **${i.author}**`).join('\n')}` : '*No songs currently queued.*')]}).catch(()=>interaction.channel.send('I cannot send an embed that hits beyond the character limit.'))
      },
      volume: ()=>{
        const vol = interaction.options.getNumber('percentage');
        useQueue(interaction.guildId).node.setVolume(vol);
        interaction.reply(`Successfully adjusted the player's volume to ${vol}%`)
      },
      shuffle: ()=>{
        useQueue(interaction.guildId).tracks.shuffle();
        interaction.reply('Songs in the queue has been shuffled.')
      },
      remove: ()=>{
        useQueue(interaction.guildId).removeTrack(interaction.options.getNumber('id',true));
        interaction.reply('Song has been removed from the queue.')
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
      .setName('pause')
      .setDescription('Pause/unpause the music'))
    .addSubcommand(x=>x
      .setName('now_playing')
      .setDescription('Check what song is currently playing'))
    .addSubcommand(x=>x
      .setName('queue')
      .setDescription('View the list of songs currently in queue'))
    .addSubcommand(x=>x
      .setName('volume')
      .setDescription('Adjust the player\'s volume')
      .addNumberOption(x=>x
        .setName('percentage')
        .setDescription('Adjust the volume level, ranges from 5 to 100, default is 75')
        .setMaxValue(100)
        .setMinValue(5)
        .setRequired(true)))
    .addSubcommand(x=>x
      .setName('shuffle')
      .setDescription('Shuffle the songs in a queue'))
    .addSubcommand(x=>x
      .setName('remove')
      .setDescription('Remove a specific song from the queue')
      .addNumberOption(x=>x
        .setName('id')
        .setDescription('Song # in the queue to be removed')
        .setMinValue(0)
        .setMaxValue(9999)
        .setRequired(true)))
}