import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

import api from './api';
import MelynxBot from './packages/bot';

const isDevelopment = process.env.NODE_ENV !== 'production';

try {
  const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
  process.env.TOKEN = settings.token;
  process.env.PREFIX = settings.prefix;
  process.env.DATABASE_URL = settings.databaseUrl;
  process.env.DISABLEDEVENTS = JSON.stringify(settings.disabledEvents);
  process.env.CLIENT_ID = settings.clientId;
  process.env.CLIENT_SECRET = settings.clientSecret;
  process.env.SENTRY_DSN = settings.sentryDsn;
  process.env.OWNER_ID = settings.ownerId;
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
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  protocol: process.env.PROTOCOL || isDevelopment ? 'http' : 'https',
  host: process.env.HOST || 'localhost:8080',
  sentryDsn: process.env.SENTRY_DSN,
  ownerId: process.env.OWNER_ID || '86708235888783360',
};

const bot = new MelynxBot(options);
bot.run();

const app = express();

if (options.sentryDsn) {
  Sentry.init({ dsn: options.sentryDsn });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/api/*', cors());
app.use('/api', api({ options, db: bot.client.db }));

if (isDevelopment) {
  // eslint-disable-next-line global-require
  const webpackConfig = require('./packages/client/webpack.config');
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  const history = require('connect-history-api-fallback');

  const compiler = webpack(webpackConfig(null, { mode: process.env.NODE_ENV || 'development' }));
  app.use(history());
  app.use(webpackDevMiddleware(compiler, { publicPath: '/' }));
}

app.use(
  '/assets/stickers',
  express.static(path.resolve(__dirname, 'packages', 'bot', 'commands', 'stickers'))
);

// Front end
app.use(express.static(path.resolve(__dirname, 'packages', 'client', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'packages', 'client', 'dist', 'index.html'));
});

// eslint-disable-next-line no-console
console.log(`Listening on port ${process.env.PORT || 8080}`);
app.listen(process.env.PORT || 8080);
