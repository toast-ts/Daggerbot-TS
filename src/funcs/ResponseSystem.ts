import Discord from 'discord.js';
import TClient from 'src/client';

/* function ResponseMadeBy(id:string){  <-- Will be enabled once autoresponse suggestion comes in.
  return `╰ *Response made by <@${id}>*`;
} */

export default class Response {
  static readonly incomingArrays = {
    morning: ['good morning all', 'good morning everyone', 'good morning lads', 'morning all', 'morning everyone', 'morning lads', 'morning guys', 'good morning everybody', 'morning yall', 'morning y\'all'],
    afternoon: ['good afternoon', 'afternoon all', 'afternoon everyone'],
    evening: ['good evening', 'evening all', 'evening everyone', 'evening lads'],
    night: ['night all', 'night everyone', 'night guys', 'goodnight', 'good night']
  } as const

  static create(client:TClient, message:Discord.Message, channel:Discord.Snowflake, keyword:string) {
    if (message.channelId != channel || message.type != 0) return;
    this.respond(client, message, keyword);
  }
  static respond(client:TClient, message:Discord.Message, responseKeyword:string) {
    if (this.incomingArrays[responseKeyword].some(m=>message.content.toLowerCase().startsWith(m))) return message.reply(`${this.outgoingArrays(client, message)[responseKeyword][Math.floor(Math.random() * this.outgoingArrays(client, message)[responseKeyword].length)]}`)
  }
  static outgoingArrays(client:TClient, message:Discord.Message) {
    const PersonnyMcPerson = `**${message.member.displayName}**`;
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
        `You have reached ${client.moment.utc().dayOfYear().toLocaleString('en-US')}th day of the year, also good morning to you as well!`, 'Good morning! Have a cookie to start your day with. :cookie:',
        'https://tenor.com/view/rambo-family-rambo-rise-and-shine-wake-up-gif-22012440'
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
        `# Night ${PersonnyMcPerson}!`, `You should try maintaining your sleep schedule if you're that really tired, ${PersonnyMcPerson}.`
      ]
    } as const
  }
}
// ty Noinkin for coming up with this suggestion/idea plus with bit of help <3
// 𝘢𝘭𝘴𝘰 𝘪𝘮 𝘯𝘰𝘵 𝘢 𝘣𝘰𝘺 :)
