import Discord from 'discord.js';
import dayjs from 'dayjs';
import Formatters from '../helpers/Formatters.js';

export default class Response {
  protected static readonly incomingArrays = {
    morning: {// Prefixes are optional in the user's message.
      prefix: ['good'],
      suffix: ['all', 'everyone', 'lads', 'guys', 'everybody', 'yall', 'y\'all', 'my neighbors']
    },
    afternoon: {
      prefix: ['good'],
      suffix: ['all', 'everyone', 'lads', 'yall', 'y\'all']
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
  static create(message:Discord.Message, channel:Discord.Snowflake, keyword:string) {
    if (message.channelId != channel || message.type != 0) return;
    this.respond(message, keyword);
  }
  protected static async respond(message:Discord.Message, responseKeyword:string) {
    if (message.type === Discord.MessageType.Reply) return;
    // Special case for "see you later"
    if (responseKeyword === 'evening' && /^see you later\b/i.test(message.content)) return message.reply(`${this.outgoingArrays(message)[responseKeyword][Math.floor(Math.random()*this.outgoingArrays(message)[responseKeyword].length)]}`).catch(()=>null);
    if (new RegExp(`^(${this.incomingArrays[responseKeyword].prefix.join('|')})?\\s?${responseKeyword} (${this.incomingArrays[responseKeyword].suffix.join('|')})\\b`, 'i').test(message.content)) return message.reply(`${this.outgoingArrays(message)[responseKeyword][Math.floor(Math.random()*this.outgoingArrays(message)[responseKeyword].length)]}`).catch(()=>null)
  }
  protected static outgoingArrays(message:Discord.Message) {
    const currDate = new Date();
    const PersonnyMcPerson = `**${message.member.displayName}**`;

    const respArrays = {
      morning: [
        `Morning ${PersonnyMcPerson}, did you sleep great?`, `Good morning ${PersonnyMcPerson}!`, `Hope you enjoyed your breakfast, ${PersonnyMcPerson}!`,
        `Gm ${PersonnyMcPerson}.`, `Uh.. What time is it? Oh yea, morning ${PersonnyMcPerson}.`, `Morning and hope you had a good dream last night, ${PersonnyMcPerson}.`,
        'Time to get started with today\'s stuff!', `Don't forget to do your morning routine, ${PersonnyMcPerson}!`, 'Enjoy the breakfast and start your day.',
        'Nuh! No morning message for you!\n*Just kidding, good morning!*', `Rise and shine, ${PersonnyMcPerson}.`, 'Howdy! How\'s your morning?',
        `*opens blinds wide enough to blast sunrays into the room*\nWakey wakey, ${PersonnyMcPerson}. Time to get up!`, 'https://tenor.com/view/skyrim-intro-awake-finally-awake-gif-22633549',
        `Good grief, is it Monday already? Anyways, morning ${PersonnyMcPerson}..`, `This time I can shout! So here we go! 1..2..3\n*inhales*\n# MORNING ${PersonnyMcPerson.toUpperCase()}!`,
        'Gooooood morning to you!', `Good morning to you! You know what else is good? A segue to our sponsor, breakfast!\nGet started with getting out of the bed and have some breakfast!`,
        `## Morning ${PersonnyMcPerson}!`, '### Have a wonderful day ahead of you!', `Here, have some pancakes for breakfast, ${PersonnyMcPerson}`, 'Is it Friday yet? This week is getting boring already!',
        `You have reached ${Formatters.DayOfTheYear(Math.floor(dayjs().diff(dayjs().startOf('year'), 'day', true))+1)} day of the year, also good morning to you as well!`,
        'Good morning! Have a cookie to start your day with. :cookie:', 'https://tenor.com/view/rambo-family-rambo-rise-and-shine-wake-up-gif-22012440',
        `Rise and shine, sleepyhead ${PersonnyMcPerson}! Ready to start your day?`, `Wake up and smell the delicious pancakes, ${PersonnyMcPerson}! It's a brand new day with many possibilities!`,
        '# *DID YOU HAVE A GREAT SLEEP LAST NIGHT?*'
      ],
      afternoon: [
        `Afternoon ${PersonnyMcPerson}!`, `What a nice day outside, ${PersonnyMcPerson}`, `Good afternoon ${PersonnyMcPerson}`,
        'Hope you had a good day so far.', `Did you enjoy your day yet, ${PersonnyMcPerson}?`, 'Weather doesn\'t look too bad outside right?',
        `How's the trip outside, ${PersonnyMcPerson}?`, `~~Morning~~ Afternoon ${PersonnyMcPerson}!`, 'Afternoon already? Jeez, time go brrrr!',
        'We\'re halfway through the day, aren\'t we?', `Ready to enjoy your delicious lunch, ${PersonnyMcPerson}?`, '### Quite a wonderful weather today!',
        `Hi there, adventurer ${PersonnyMcPerson}! What's on your agenda for the rest of today?`, `Afternoon ${PersonnyMcPerson}, back from your trip outside?`,
        'Did you have a wonderful and productive day so far?', `How are you doing today, ${PersonnyMcPerson}?`, `Good afternoon ${PersonnyMcPerson}, I hope you're having a fanastic day than a poor particular penguin in Antarctica that just slipped!`,
        `Afternoon ${PersonnyMcPerson}! What's the current progress on your todo list? Did you finish them?`, `Good afternoon ${PersonnyMcPerson}! Hope your day is going better than a penguin in a snowstorm in Antarctica!`,
        `Afternoon ${PersonnyMcPerson}! How's the quest for the perfect snack coming along?\nRemember, it's all about the journey, not the destination... *unless the destination is the... fridge.*`
      ],
      evening: [
        'I can\'t believe the time flies so quickly!', `Evening ${PersonnyMcPerson}!`, `Hope you enjoyed the dinner, ${PersonnyMcPerson}!`,
        `Good evening ${PersonnyMcPerson}!`, 'You look tired, ready to go to sleep yet?', 'Being outside was an exhausting task isn\'t it?',
        'Did you have a good day so far?', 'May I suggest sleep?', `You heard me! ${PersonnyMcPerson}, it's almost dinner time!`,
        `How's your day going, ${PersonnyMcPerson}?`, `${PersonnyMcPerson}, may I suggest... *sleep?*`, 'Today is almost over, you deserve some rest!',
        `Good evening ${PersonnyMcPerson}! Just remember, the absolute best part of the day is yet to come... **bedtime!** Who's with me? <a:MichaelSurprised:1016297232263286825>`
      ],
      night: [
        `Good night ${PersonnyMcPerson}!`, `Night ${PersonnyMcPerson}!`, `Sweet dreams, ${PersonnyMcPerson}.`, `Don't fall out of sky in your dreamworld, ${PersonnyMcPerson}!`,
        'Nighty night!', `I hope tomorrow is a good day for you, ${PersonnyMcPerson}!`, `Have a good sleep, ${PersonnyMcPerson}!`, `I :b:et you a cookie if you actually slept through the night! ${PersonnyMcPerson}`,
        `Sleep well ${PersonnyMcPerson}.`, `Gn ${PersonnyMcPerson}.`, `Close your eyelids and sleep, ${PersonnyMcPerson}.`, `Good night ${PersonnyMcPerson} and hope your pillow is nice and cold!`,
        `# Night ${PersonnyMcPerson}!`, `You should try maintaining your sleep schedule if you're really that tired, ${PersonnyMcPerson}.`, `Goodnight ${PersonnyMcPerson}, time to recharge your social batteries for tomorrow!`,
        `Have a good night ${PersonnyMcPerson}, don't let the bed bugs bite!`, `Sweet dreams, ${PersonnyMcPerson}! Hope your dreams are as wild as unpredictable as a Netflix algorithm!`
      ]
    };

    // Better Breakfast Day (Sept. 26)
    if (currDate.getUTCMonth() === 8 && currDate.getUTCDate() === 26) {
      return {
        morning: [
          `Hello ${PersonnyMcPerson}, have you tried avocado toast for breakfast?`,
          `Hey and good morning ${PersonnyMcPerson}!\nDid you know that breakfast is the most important meal of the day?`,
          `Morning ${PersonnyMcPerson}, having a balanced breakfast can help you feel more energized throughout the day.`,
          `Good morning ${PersonnyMcPerson}, how about some eggs benedict for breakfast today?`,
          `Morning ${PersonnyMcPerson}!\nDid you know that a high protein breakfast can help control your hunger throughout the day?`,
          'Have you tried a breakfast burrito? They\'re delicious and filling.',
          `Morning ${PersonnyMcPerson}, remember that fruits are a great addition to your breakfast.`,
          `Hello ${PersonnyMcPerson}!\nStart your morning with some French toast for a treat. They're easy to make and tastes delicious!`,
          'A breakfast sandwich or toast is a quick and easy option for busy mornings.',
          `Good morning ${PersonnyMcPerson}, don't forget to add some veggies to your breakfast for extra nutrients.`,
          `Morning ${PersonnyMcPerson}, have you tried a breakfast casserole? They're a great make-ahead option.`,
          'Cereal is the quickest option to start your busy day with!',
          `Gooood morning ${PersonnyMcPerson}! How about some pancakes for breakfast today?`,
          `Morning ${PersonnyMcPerson}, don't forget to have some milk with your breakfast.`
        ],
        afternoon: respArrays.afternoon,
        evening: respArrays.evening,
        night: respArrays.night
      }
    } else return {
      morning: respArrays.morning,
      afternoon: respArrays.afternoon,
      evening: respArrays.evening,
      night: respArrays.night
    }
  }
}
/*
  ty Noinkin for coming up with this suggestion/idea plus with bit of help <3
  Rewritten by Toast on 28/11/2023
*/
