//import  Settings from './interfaces/settings';
import MelynxBot from './bot/bot';

const options = require('./settings.json');
const bot = new MelynxBot(options);
bot.run();