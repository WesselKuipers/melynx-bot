import MelynxBot from './bot/bot';

let options;
try {
  options = require('./settings.json');
} catch (e) { 
  console.log('Could not find settings.json, loading from ENV instead.');
  options = {
    token: process.env.TOKEN,
    prefix: process.env.PREFIX,
  };
}

const bot = new MelynxBot(options);
bot.run();
