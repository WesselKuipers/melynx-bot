import { Collection, ActivityOptions } from 'discord.js';
import moment from 'moment';
import { Sequelize, DataTypes, Model } from 'sequelize';
import { AkairoClient, CommandHandler, SequelizeProvider } from 'discord-akairo';

import Command from '../types/command';
import {
  MelynxClient,
  DbSettings,
  MelynxMessage,
  Tag,
  Role,
  Session,
  FriendCode,
} from '../types/melynxClient';
import path from 'path';
import { getGuildSettings } from './utils';
import SessionManager from './sessionManager';

export interface ApplicationSettings {
  prefix: string;
  token: string;
  databaseUrl: string;
  disabledEvents: [];
  clientId: string;
  clientSecret: string;
  protocol: 'http' | 'https';
  host: string;
  sentryDsn: string;
  ownerId: string;
  port: number;
}

const regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const playingLines: ActivityOptions[] = [
  { type: 'PLAYING', name: 'stealing gems from hunters' },
  { type: 'PLAYING', name: 'with a hunter' },
  { type: 'STREAMING', name: 'smoking felvine' },
  { type: 'PLAYING', name: 'the hunting horn' },
  { type: 'PLAYING', name: 'the fungasax' },
  { type: 'PLAYING', name: 'with your palico' },
  { type: 'PLAYING', name: 'with the Meowstress' },
  { type: 'PLAYING', name: 'with the Mewstress' },
  { type: 'PLAYING', name: 'Monster Hunter World' },
  { type: 'PLAYING', name: 'Monster Hunter Generations Ultimate' },
  { type: 'PLAYING', name: 'Monster Hunter World: Iceborne' },
  { type: 'PLAYING', name: 'Monster Hunter 4 Ultimate' },
  { type: 'PLAYING', name: 'Monster Hunter Frontier' },
  { type: 'PLAYING', name: 'with a Khezu' },
  { type: 'LISTENING', name: "Khezu's theme" },
  { type: 'WATCHING', name: 'hunters carrying eggs' },
];

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(
    `[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${message.replace(regToken, '[TOKEN]')}`
  );
}

function error(error: Error) {
  this.log(`Error: ${error.message}`);
}

function warn(warning: string) {
  this.log(`Warning: ${warning}`);
}

export class MelynxBot {
  client: MelynxClient;
  commands: Collection<string, Command>;
  aliases: Collection<string, Command>;
  settings: ApplicationSettings;

  constructor(settings: ApplicationSettings) {
    this.settings = settings;

    this.client = new AkairoClient(
      { ownerID: settings.ownerId },
      { disableMentions: 'everyone' }
    ) as MelynxClient;
    this.client.options.ownerId = settings.ownerId;
    this.client.options.host = settings.host;

    const isDev = process.env.NODE_ENV !== 'production';
    const db = new Sequelize(
      isDev ? settings.databaseUrl : `${settings.databaseUrl}?sslmode=require`,
      {
        logging: false,
        dialect: isDev ? 'mysql' : 'postgres',
        dialectOptions: isDev ? {} : { ssl: { rejectUnauthorized: false } },
      }
    );
    const guildSettings = db.define<DbSettings>('settings', {
      guildId: { type: DataTypes.STRING, unique: true, primaryKey: true },
      settings: DataTypes.JSON,
    });

    const tagModel = db.define<Tag>(
      'tag',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        guildId: { type: DataTypes.STRING, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        content: { type: DataTypes.STRING, allowNull: false },
      },
      { createdAt: 'date' }
    );

    const roleModel = db.define<Role>(
      'role',
      {
        id: { type: DataTypes.STRING, primaryKey: true },
        guildId: { type: DataTypes.STRING, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
      },
      { createdAt: 'date' }
    );

    const sessionModel = db.define<Session>(
      'session',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        guildId: { type: DataTypes.STRING, allowNull: false },
        userId: { type: DataTypes.STRING, allowNull: false },
        avatar: { type: DataTypes.STRING, allowNull: true },
        creator: { type: DataTypes.STRING, allowNull: false },
        platform: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: DataTypes.STRING,
        sessionId: { type: DataTypes.STRING, unique: true, allowNull: false },
        channelId: { type: DataTypes.STRING, allowNull: false },
      },
      { createdAt: 'date' }
    );

    const friendCodeModel = db.define<FriendCode>(
      'friendcode',
      {
        id: {
          type: DataTypes.STRING,
          primaryKey: true,
        },
        fc: { type: DataTypes.STRING, allowNull: false },
      },
      { createdAt: 'date' }
    );

    this.client.db = db;
    this.client.settings = { model: guildSettings, cache: {} };
    this.client.models = {
      tag: tagModel,
      role: roleModel,
      session: sessionModel,
      friendCode: friendCodeModel,
    };

    this.client.log = log;
    this.client.warn = warn;
    this.client.error = error;

    guildSettings.sync();
    tagModel.sync();
    roleModel.sync();
    friendCodeModel.sync();

    const handler = new CommandHandler(this.client, {
      directory: path.join(__dirname, '..', 'commands'),
      allowMention: true,
      handleEdits: true,
      blockBots: true,
      blockClient: true,
      commandUtil: true,
      prefix: async (message) =>
        message.guild
          ? (await getGuildSettings(this.client, message.guild.id)).prefix
          : this.settings.prefix,
    });

    this.client.sessionManager = new SessionManager();
    this.client.commandHandler = handler;
    this.client.commandHandler.loadAll();
  }

  run() {
    this.client.login(this.settings.token);

    this.client.on('ready', async () => {
      this.client.log(
        `Connected to ${this.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} users on ${
          this.client.guilds.cache.size
        } servers.`
      );

      await this.client.user.setActivity(
        playingLines[Math.floor(Math.random() * playingLines.length)]
      );

      await this.client.sessionManager.init(this.client);
    });

    this.client.on('guildDelete', (guild) => {
      // When the bot leaves or is kicked, delete settings to prevent stale entries.
      this.client.log(`Left guild ${guild.id} (${guild.name})`);
      this.client.settings.model.destroy({ where: { guildId: guild.id } });
    });

    this.client.on('error', (error) => this.client.error(error));
    this.client.on('warn', (warning) => this.client.warn(warning));
  }
}
