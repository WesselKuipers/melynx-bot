import MelynxBot from './bot/bot';
import express from 'express';

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

const app = express();
app.get('/', (req, res) => {
  return res.send('I\'m still alive, nya!');
});

app.get('/sessions/:guildId(\\d+)?', async (req, res) => {
  const { guildId } = req.params;
  const sessions = guildId ? await bot.client.db.models.session.findAll({where: { guildId }, raw: true}) : await bot.client.db.models.session.findAll({raw:true});

  return res.send(sessions);
});

// eslint-disable-next-line no-console
console.log(`Listening on port ${process.env.PORT}`);
app.listen(process.env.PORT || 3000);
