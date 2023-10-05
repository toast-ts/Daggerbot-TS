import Discord from 'discord.js';
import TClient from '../client.js';
import TSClient from '../helpers/TSClient.js';
import {Player,useTimeline,useQueue} from 'discord-player';
import {SpotifyExtractor} from '@discord-player/extractor';

export default {
  async run(client: TClient, interaction: Discord.ChatInputCommandInteraction<'cached'>){
    if (!client.config.botSwitches.music && !client.config.whitelist.includes(interaction.user.id)) return interaction.reply({content:'Music module is currently disabled.',ephemeral:true});
    if (!client.isStaff(interaction.member) && !client.config.whitelist.includes(interaction.member.id)) return interaction.reply('Music module is close to being completed, some parts may be incomplete or broken, so it has been restricted to staff for time-being.');
    const player = Player.singleton(client);
    await player.extractors.register(SpotifyExtractor,{clientId: (await TSClient.Token()).spotify.client, clientSecret: (await TSClient.Token()).spotify.secret});
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
    const queue = useQueue(interaction.guildId);
    ({
      play: async()=>{
        const url = interaction.options.getString('url');
        if (!url.includes('https://open.spotify.com/')) return interaction.reply('Sorry, I can\'t play that. I can only accept Spotify links that contains `https://open.spotify.com/`'); // Yes, I made it clear that it's intended typo.
        if (!(await player.search(url,{requestedBy:interaction.user})).hasTracks()) return interaction.reply(`No results found for \`${url}\`\nIt is either private, unavailable or you made a *tpyo* in your query.`)
        player.play(interaction.member.voice.channel, url);
        await interaction.reply(`Added the ${url.includes('playlist/') ? 'playlist' : url.includes('album/') ? 'album' : 'song'} to the queue.`);
      },
      stop: async()=>{
        player.destroy();
        await interaction.reply('Player destroyed.')
      },
      pause: ()=>{
        queue.node.setPaused(!queue.node.isPaused());
        if (queue.node.isPaused()) interaction.reply('Music has been paused.');
        else interaction.reply('Music has been resumed.')
      },
      now_playing: ()=>{
        const {volume,timestamp,track} = useTimeline(interaction.guildId);
        if (!track) return interaction.reply('There\'s nothing playing, why are you checking?');
        else {
          function convertNumberToText(input:number){
            switch(input){
              case 0: return 'Off';
              case 1: return 'Track';
              case 2: return 'Queue';
              case 3: return 'Autoplay DJ';
            }
          }
          interaction.reply({embeds:[
            new client.embed().setColor(client.config.embedColor).setTitle(`${track.title} - ${track.author}`).setThumbnail(track.thumbnail).addFields(
              {name: 'Timestamp', value: `**${timestamp.current.label}**/**${timestamp.total.label}**`, inline: true},
              {name: 'Volume', value: `${volume}%`, inline: true},
              {name: 'Loop mode', value: `${convertNumberToText(queue.repeatMode)}`, inline: true}
            )
          ]})
        }
      },
      queue: async()=>interaction.reply({embeds:[new client.embed().setColor(client.config.embedColor).setTitle(`Songs currently in the queue: ${queue.tracks.size}`).setDescription(queue.tracks.size > 0 ? `\`\`\`${queue.tracks.map(i=>`${i.title} - ${i.author}\`\`\``).join('```\n')}`.slice(0,1017) : '*No songs currently queued.*')]}),
      volume: ()=>{
        const vol = interaction.options.getNumber('percentage');
        queue.node.setVolume(vol);
        interaction.reply(`Successfully adjusted the player's volume to ${vol}%`)
      },
      shuffle: ()=>{
        queue.tracks.shuffle();
        interaction.reply('Songs in the queue has been shuffled.')
      },
      remove: ()=>{
        queue.removeTrack(interaction.options.getNumber('id',true));
        interaction.reply('Song has been removed from the queue.')
      },
      skip: ()=>{
        queue.node.skip();
        interaction.reply('Skipped the current song, now playing the next one in queue.')
      },
      loop: ()=>{
        const loopMode = interaction.options.getNumber('mode',true);
        queue.setRepeatMode(loopMode);
        interaction.reply(`Loop mode is now ${loopMode === 0 ? 'disabled.' : loopMode === 1 ? 'set to loop current track.': loopMode === 2 ? 'looping through current queue.' : 'activating Autoplay DJ.'}`)
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
      .setName('skip')
      .setDescription('Skip the current song and play the next one'))
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
      .setName('loop')
      .setDescription('Loop through queue or current track or enable Autoplay DJ')
      .addNumberOption(x=>x
        .setName('mode')
        .setDescription('Select the available modes to use')
        .addChoices(
          {name: 'Off', value: 0},
          {name: 'Current track', value: 1},
          {name: 'Queue', value: 2},
          {name: 'Autoplay DJ (Play related songs based on queue)', value: 3}
        )
        .setRequired(true)))
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