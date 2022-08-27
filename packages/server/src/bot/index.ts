import {
  Collection,
  ActivityOptions,
  Client,
  Interaction,
  ActivityType,
  Partials,
  GatewayIntentBits,
} from 'discord.js';
import moment from 'moment';
import { Sequelize, DataTypes } from 'sequelize';
import * as commands from '../commands';
import { MelynxClient, DbSettings, Tag, Role, Session, FriendCode, MelynxCommand } from '../types';
import SessionManager from './sessionManager';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

export interface ApplicationSettings {
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
  devServer: string;
}

const regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
const playingLines: ActivityOptions[] = [
  { type: ActivityType.Playing, name: 'stealing gems from hunters' },
  { type: ActivityType.Playing, name: 'with a hunter' },
  { type: ActivityType.Streaming, name: 'smoking felvine' },
  { type: ActivityType.Playing, name: 'the hunting horn' },
  { type: ActivityType.Playing, name: 'the fungasax' },
  { type: ActivityType.Playing, name: 'with your palico' },
  { type: ActivityType.Playing, name: 'with the Meowstress' },
  { type: ActivityType.Playing, name: 'with the Mewstress' },
  { type: ActivityType.Playing, name: 'Monster Hunter World' },
  { type: ActivityType.Playing, name: 'Monster Hunter Generations Ultimate' },
  { type: ActivityType.Playing, name: 'Monster Hunter World: Iceborne' },
  { type: ActivityType.Playing, name: 'Monster Hunter 4 Ultimate' },
  { type: ActivityType.Playing, name: 'Monster Hunter Frontier' },
  { type: ActivityType.Playing, name: 'with a Khezu' },
  { type: ActivityType.Listening, name: "Khezu's theme" },
  { type: ActivityType.Watching, name: 'hunters carrying eggs' },
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
  commands: Collection<string, MelynxCommand>;
  settings: ApplicationSettings;

  constructor(settings: ApplicationSettings) {
    this.settings = settings;

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
      ],
      partials: [Partials.Channel, Partials.Message, Partials.Reaction],
    }) as MelynxClient;
    this.client.options.ownerId = settings.ownerId;
    this.client.options.host = settings.host;

    const isDev = process.env.NODE_ENV !== 'production';
    log(`Starting bot in ${isDev ? 'dev' : 'production'} mode`);
    const db = new Sequelize(settings.databaseUrl, {
      logging: false,
      dialect: isDev ? 'mysql' : 'postgres',
    });

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
        description: { type: DataTypes.STRING, allowNull: true },
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
        sessionId: { type: DataTypes.STRING, allowNull: false },
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
    roleModel.sync({ alter: true });
    friendCodeModel.sync();

    this.client.commands = new Collection();
    for (const command of Object.values(commands)) {
      this.client.commands.set(command.data.name, command);
    }

    this.client.sessionManager = new SessionManager();
    this.client.on('interactionCreate', (interaction) => {
      this.onCommandInteraction(this.client, interaction);
      this.onMessageComponentInteraction(this.client, interaction);
    });
  }

  async registerCommands() {
    log('Refreshing application commands.');
    const isDev = process.env.NODE_ENV !== 'production';
    const rest = new REST({ version: '9' }).setToken(this.settings.token);
    const body = this.client.commands.map((command) => command.data.toJSON());

    if (isDev) {
      this.client.log(`Refreshing ${this.client.commands.size} commands for devServer`);
      await rest.put(
        Routes.applicationGuildCommands(this.settings.clientId, this.settings.devServer),
        { body }
      );
    } else {
      this.client.log(`Refreshing ${this.client.commands.size} commands globally`);
      await rest.put(Routes.applicationCommands(this.settings.clientId), { body });
    }

    this.client.log('Finished refreshing application commands.');
  }

  async onCommandInteraction(client: MelynxClient, interaction: Interaction) {
    if (!interaction.isCommand()) {
      return;
    }

    if (!this.client.commands.has(interaction.commandName)) {
      return;
    }

    try {
      await this.client.commands.get(interaction.commandName).execute(interaction, client);
    } catch (error) {
      this.client.error(error);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  }

  async onMessageComponentInteraction(client: MelynxClient, interaction: Interaction) {
    if (!interaction.isMessageComponent()) {
      return;
    }

    // The format for message component interactions is commandName/any other data, /-separated.
    const id = interaction.customId;
    const [commandName] = id.split('/');

    const command = client.commands.get(commandName);
    this.client.log(`Executing command component ${id} on server ${interaction.guildId}`);

    if (!command || !command.componentExecute) {
      return;
    }

    await command?.componentExecute(interaction, client);
  }

  run() {
    this.client.login(this.settings.token);

    this.client.on('ready', async () => {
      this.client.log(`Connected to ${this.client.guilds.cache.size} servers.`);
      this.client.user.setActivity(playingLines[Math.floor(Math.random() * playingLines.length)]);

      await this.registerCommands();
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
