import MelynxBot from './bot/bot';
import http from 'http';

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

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write('Hello World!');
  res.end();
}).listen(process.env.PORT || 3000);