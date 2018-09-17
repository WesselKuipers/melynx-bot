import MelynxBot from './bot/bot';
import http from 'http';

try {
  const options = require('./settings.json');
  process.env.TOKEN = options.token;
  process.env.PREFIX = options.prefix;
  process.env.DATABASE_URL = options.databaseUrl;
  process.env.DISABLEDEVENTS = JSON.stringify(options.disabledEvents);
} catch (e) {
  // eslint-disable-next-line no-console
  console.log('Could not find settings.json, falling back to ENV');
}

if (!process.env.TOKEN || !process.env.PREFIX || !process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.log('TOKEN, PREFIX and DATABASE_URL environment variables must be present');
}

const options = {
  prefix: process.env.PREFIX,
  token: process.env.TOKEN,
  databaseUrl: process.env.DATABASE_URL,
  disabledEvents: JSON.parse(process.env.DISABLEDEVENTS || '[]'),
};

const bot = new MelynxBot(options);
bot.run();

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write('Hello World!');
  res.end();
}).listen(process.env.PORT || 3000);