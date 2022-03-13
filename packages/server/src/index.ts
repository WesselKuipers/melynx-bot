import 'dotenv/config';
import { init as SentryInit, Handlers as SentryHandlers } from '@sentry/node';
import cors from 'cors';
import express from 'express';
import path from 'path';
import history from 'connect-history-api-fallback';

import { API } from './api/index';
import { ApplicationSettings, MelynxBot } from './bot';

const isDevelopment = process.env.NODE_ENV !== 'production';

if (!process.env.TOKEN || !process.env.PREFIX || !process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.log('TOKEN, PREFIX and DATABASE_URL environment variables must be present');
}

const options: ApplicationSettings = {
  token: process.env.TOKEN,
  databaseUrl: process.env.DATABASE_URL,
  disabledEvents: JSON.parse(process.env.DISABLEDEVENTS || '[]'),
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  protocol: process.env.PROTOCOL || isDevelopment ? 'http' : 'https',
  host: process.env.HOST || 'http://localhost',
  sentryDsn: process.env.SENTRY_DSN,
  ownerId: process.env.OWNER_ID || '86708235888783360',
  port: Number(process.env.PORT) || 8080,
  devServer: process.env.DEV_SERVER,
};

const bot = new MelynxBot(options);

const app = express();

if (options.sentryDsn) {
  SentryInit({ dsn: options.sentryDsn });
  app.use(SentryHandlers.requestHandler());
  app.use(SentryHandlers.errorHandler());
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(history());

app.use('/api/*', cors());
app.use('/api', API({ options, db: bot.client.db }));

app.use('/assets/stickers', express.static(path.resolve(__dirname, 'assets', 'stickers')));

// Serve the front-end
app.use(express.static(path.resolve(__dirname, '..', '..', 'client', 'dist')));
app.get('*', (_, res) => {
  res.sendFile(path.resolve(__dirname, '..', '..', 'client', 'dist', 'index.html'));
});

bot.run();

console.log(`Listening on: ${options.host}:${options.port}`);
app.listen(options.port);
