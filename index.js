import axios from 'axios';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import MelynxBot from './bot/bot';

try {
  const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
  process.env.TOKEN = settings.token;
  process.env.PREFIX = settings.prefix;
  process.env.DATABASE_URL = settings.databaseUrl;
  process.env.DISABLEDEVENTS = JSON.stringify(settings.disabledEvents);
} catch (e) {
  // eslint-disable-next-line no-console
  console.log('Could not find settings.json, falling back to ENV');
}

if (!process.env.TOKEN || !process.env.PREFIX || !process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.log(
    'TOKEN, PREFIX and DATABASE_URL environment variables must be present'
  );
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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/api/sessions/:guildId(\\d+)?', cors(), async (req, res) => {
  const { guildId } = req.params;
  const sessions = guildId
    ? await bot.client.db.models.session.findAll({
        where: { guildId },
        raw: true,
      })
    : await bot.client.db.models.session.findAll({ raw: true });

  return res.send(sessions);
});

app.get('/api/catfact', async (req, res) => {
  const { data } = await axios.get(
    'https://cat-fact.herokuapp.com/facts/random'
  );
  res.send(data);
});

// Front end
app.use(express.static(path.resolve(__dirname, 'client', 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});

// eslint-disable-next-line no-console
console.log(`Listening on port ${process.env.PORT || 8080}`);
app.listen(process.env.PORT || 8080);
