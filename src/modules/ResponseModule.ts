import Discord from 'discord.js';
import TClient from '../client.js';
import Formatters from '../helpers/Formatters.js';

export default class Response {
  protected static readonly incomingArrays = {
    morning: {// Prefixes are optional in the user's message.
      prefix: ['good'],
      suffix: ['all', 'everyone', 'lads', 'guys', 'everybody', 'yall', 'y\'all', 'my neighbors']
    },
    afternoon: {
      prefix: ['good'],
      suffix: ['all', 'everyone', 'lads']
    },
    evening: {
      prefix: ['good'],
      suffix: ['all', 'everyone', 'lads', 'yall', 'y\'all']
    },
    night: {
      prefix: ['good'],
      suffix: ['all', 'everyone', 'guys', 'yall', 'y\'all']
    }
  }
  static create(client:TClient, message:Discord.Message, channel:Discord.Snowflake, keyword:string) {
    if (message.channelId != channel || message.type != 0) return;
    this.respond(client, message, keyword);
  }
  protected static async respond(client:TClient, message:Discord.Message, responseKeyword:string) {
    if (message.type === Discord.MessageType.Reply) return;
    if (new RegExp(`^(${this.incomingArrays[responseKeyword].prefix.join('|')})?\\s?${responseKeyword} (${this.incomingArrays[responseKeyword].suffix.join('|')})\\b`, 'i').test(message.content)) return message.reply(`${this.outgoingArrays(client, message)[responseKeyword][Math.floor(Math.random()*this.outgoingArrays(client, message)[responseKeyword].length)]}`).catch(()=>null)
  }
  protected static outgoingArrays(client:TClient, message:Discord.Message) {
    const PersonnyMcPerson = `**${message.member.displayName}**`;
    // const responseCreator =(id:Discord.Snowflake)=>`\n╰*Response made by <@${id}>*`;
    return {
      morning: [
        `Morning ${PersonnyMcPerson}, did you sleep great?`, `Good morning ${PersonnyMcPerson}!`, `Hope you enjoyed your breakfast, ${PersonnyMcPerson}!`,
        `Gm ${PersonnyMcPerson}.`, `Uh.. What time is it? Oh yea, morning ${PersonnyMcPerson}.`, `Morning and hope you had a good dream last night, ${PersonnyMcPerson}.`,
        'Time to get started with today\'s stuff!', `Don't forget to do your morning routine, ${PersonnyMcPerson}!`, 'Enjoy the breakfast and start your day.',
        'Nuh! No morning message for you!\n*Just kidding, good morning!*', `Rise and shine, ${PersonnyMcPerson}.`, 'Howdy! How\'s your morning?',
        `*opens blinds wide enough to blast sunrays into the room*\nWakey wakey, ${PersonnyMcPerson}. Time to get up!`, 'https://tenor.com/view/skyrim-intro-awake-finally-awake-gif-22633549',
        `Good grief, is it Monday already? Anyways, morning ${PersonnyMcPerson}..`, `This time I can shout! So here we go! 1..2..3\n*inhales*\nMORNING ${PersonnyMcPerson.toUpperCase()}!`,
        'Gooooood morning to you!', `Good morning to you! You know what else is good? A segue to our sponsor, breakfast!\nGet started with getting out of the bed and have some breakfast!`,
        `## Morning ${PersonnyMcPerson}!`, '### Have a wonderful day ahead of you!', `Here, have some pancakes for breakfast, ${PersonnyMcPerson}`, 'Is it Friday yet? This week is getting boring already!',
        `You have reached ${Formatters.DayOfTheYear(Math.floor(client.dayjs().diff(client.dayjs().startOf('year'), 'day', true))+1)} day of the year, also good morning to you as well!`,
        'Good morning! Have a cookie to start your day with. :cookie:', 'https://tenor.com/view/rambo-family-rambo-rise-and-shine-wake-up-gif-22012440'
      ],
      afternoon: [
        `Afternoon ${PersonnyMcPerson}!`, `What a nice day outside, ${PersonnyMcPerson}`, `Good afternoon ${PersonnyMcPerson}`,
        'Hope you had a good day so far.', `Did you enjoy your day yet, ${PersonnyMcPerson}?`, 'Weather doesn\'t look too bad outside right?',
        `How's the trip outside, ${PersonnyMcPerson}?`, `~~Morning~~ Afternoon ${PersonnyMcPerson}!`, 'Afternoon already? Jeez, time go brrrr!',
        'We\'re halfway through the day, aren\'t we?', `Ready to enjoy your delicious lunch, ${PersonnyMcPerson}?`, '### Quite a wonderful weather today!'
      ],
      evening: [
        'I can\'t believe the time flies so quickly!', `Evening ${PersonnyMcPerson}!`, `Hope you enjoyed the dinner, ${PersonnyMcPerson}!`,
        `Good evening ${PersonnyMcPerson}!`, 'You look tired, ready to go to sleep yet?', 'Being outside was an exhausting task isn\'t it?',
        'Did you have a good day so far?', 'May I suggest sleep?', `You heard me! ${PersonnyMcPerson}, it's almost dinner time!`,
        `How's your day going, ${PersonnyMcPerson}?`, `${PersonnyMcPerson}, may I suggest... *sleep?*`, 'Today is almost over, you deserve some rest!'
      ],
      night: [
        `Good night ${PersonnyMcPerson}!`, `Night ${PersonnyMcPerson}!`, `Sweet dreams, ${PersonnyMcPerson}.`, `Don't fall out of sky in your dreamworld, ${PersonnyMcPerson}!`,
        'Nighty night!', `I hope tomorrow is a good day for you, ${PersonnyMcPerson}!`, `Have a good sleep, ${PersonnyMcPerson}!`, `I :b:et you a cookie if you actually slept through the night! ${PersonnyMcPerson}`,
        `Sleep well ${PersonnyMcPerson}.`, `Gn ${PersonnyMcPerson}.`, `Close your eyelids and sleep, ${PersonnyMcPerson}.`, `Good night ${PersonnyMcPerson} and hope your pillow is nice and cold!`,
        `# Night ${PersonnyMcPerson}!`, `You should try maintaining your sleep schedule if you're really that tired, ${PersonnyMcPerson}.`
      ]
    }
  }
}
/*
  ty Noinkin for coming up with this suggestion/idea plus with bit of help <3
  Rewritten by Toast on 28/11/2023
*/