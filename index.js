import axios from 'axios';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import btoa from 'btoa';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import MelynxBot from './bot/bot';
import webpackConfig from './client/webpack.config';

const compiler = webpack(webpackConfig(null, { mode: 'development' }));

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
app.use(webpackDevMiddleware(compiler));

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

const CLIENT_ID = '489555694211694602';
const CLIENT_SECRET = 'FesHTksz98bgLuP6qAZb3WR5YGxRR4gc';

const redirect = encodeURIComponent(
  'http://localhost:8080/api/discord/callback'
);

app.get('/api/discord/login', (req, res) => {
  res.redirect(
    `https://discordapp.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${redirect}`
  );
});

app.get('/api/discord/callback', async (req, res) => {
  if (!req.query.code) throw new Error('NoCodeProvided');
  const { code } = req.query;
  const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const {
    data: { access_token: token },
  } = await axios.get(
    `https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
      },
    }
  );

  res.redirect(`/?token=${token}`);
});

// Front end
app.use(express.static(path.resolve(__dirname, 'client', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
});

// eslint-disable-next-line no-console
console.log(`Listening on port ${process.env.PORT || 8080}`);
app.listen(process.env.PORT || 8080);
