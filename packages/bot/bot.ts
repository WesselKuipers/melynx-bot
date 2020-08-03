import Discord, { Message, ActivityOptions } from 'discord.js';
import moment from 'moment';
import { Sequelize, DataType, DataTypes } from 'sequelize';

import * as commands from './commands';
import Command from './types/command';
import { MelynxClient, DbSettings } from './types/melynxClient';

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
  log(`Error: ${error.message}`);
}

function warn(warning: string) {
  this.log(`Warning: ${warning}`);
}

export default class MelynxBot {
  client: MelynxClient;
  commands: Discord.Collection<string, Command>;
  aliases: Discord.Collection<string, Command>;
  settings: ApplicationSettings;

  constructor(settings: ApplicationSettings) {
    this.settings = settings;

    this.client = new Discord.Client() as MelynxClient;
    this.commands = new Discord.Collection();
    this.aliases = new Discord.Collection();

    const db = new Sequelize(settings.databaseUrl, { logging: false });
    const guildSettings = db.define<DbSettings>('settings', {
      guildId: { type: DataTypes.STRING, unique: true, primaryKey: true },
      settings: DataTypes.JSON,
    });

    this.client.db = db;
    this.client.settings = guildSettings;

    this.client.defaultSettings = {
      guildId: '0',
      prefix: settings.prefix,
      modRole: 'Moderator',
      adminRole: 'Administrator',
      sessionTimeout: 28800000, // 8 hours
      sessionRefreshTimeout: 300000, // 5 minutes
      sessionChannel: undefined,
      sessionChannelMessage: undefined,
      channelSettings: {},
    };

    this.client.log = log;
    this.client.warn = warn;
    this.client.error = error;
  }

  run() {
    this.client.login(this.settings.token);

    this.client.on('ready', () => {
      this.client.log(
        `Connected to ${this.client.users.cache.size} users on ${this.client.guilds.cache.size} servers.`
      );
      this.loadCommands();

      this.client.user.setActivity(playingLines[Math.floor(Math.random() * playingLines.length)]);
      this.client.settings.sync();
    });

    this.client.on('guildDelete', (guild) => {
      // When the bot leaves or is kicked, delete settings to prevent stale entries.
      this.client.log(`Left guild ${guild.id} (${guild.name})`);
      this.client.settings.destroy({ where: { guildId: guild.id } });
    });

    this.client.on('error', (error) => this.client.error(error));
    this.client.on('warn', (warning) => this.client.warn(warning));
    this.client.on('message', (message) => this.message(message));
  }

  async loadCommands() {
    await Promise.all(
      Object.values(commands).map(async (command) => {
        // If command has an init method, run it
        if (command.init) {
          this.client.log(`Running init of ${command.help.name}`);
          await command.init(this.client);
        }

        // Assign the main command name to commands, as well as all of its aliases
        this.commands.set(command.help.name, command);
        if (command.config.aliases) {
          command.config.aliases.forEach((alias) => {
            if (this.aliases.has(alias)) {
              this.client.log(
                `Warning: Command ${command.help.name} alias ${alias} overlaps with command ${
                  this.aliases.get(alias).help.name
                }.\r\nOld alias will be overwritten.`
              );
            }

            this.aliases.set(alias, command);
          });
        }

        this.client.log(
          `Loaded command [${command.help.name}] with aliases [${command.config.aliases.join(
            ', '
          )}]`
        );
      })
    );

    this.client.commands = this.commands;
    this.client.aliases = this.aliases;
  }

  async message(message: Message) {
    if (message.author === this.client.user) {
      return; // don't respond to yourself
    }

    let guildConfEntry;

    if (message.guild) {
      guildConfEntry = (await this.client.settings.findByPk(message.guild.id)).settings;
    } else {
      guildConfEntry = this.client.defaultSettings;
    }

    if (!guildConfEntry && message.guild) {
      guildConfEntry = await this.client.settings.create({
        guildId: message.guild.id,
        settings: this.client.defaultSettings,
      });
      this.client.log(`Initialized config for guild ${message.guild.id}`);
    }

    const guildConf = {
      ...this.client.defaultSettings,
      ...guildConfEntry,
    };
    const prefixRegex = new RegExp(
      `^(<@!?${this.client.user.id}>|${escapeRegex(guildConf.prefix)})\\s*`
    );

    if (!prefixRegex.test(message.content)) {
      return; // doesn't start with prefix or mention, don't care what the message is
    }

    const split = message.content.split(/\w+/);

    if (split.length === 1) {
      return; // usage of mention or prefix without a command
    }

    const commandName = split[1].toLowerCase();
    const params = split.slice(2);

    const command = this.commands.get(commandName) || this.aliases.get(commandName);
    if (!command) return;

    if (command.config.guildOnly && message.channel.type !== 'text') {
      return;
    }

    if (command.config.ownerOnly && message.author.id !== this.client.options.ownerId) {
      return;
    }

    if (command.config.permissionLevel > 0) {
      const isAdmin =
        message.member.roles.cache.some((roles) => roles.name === guildConf.adminRole) ||
        message.author.id === this.client.options.ownerId;
      const isMod =
        message.member.roles.cache.some(
          (roles) => roles.name === guildConf.modRole || roles.name === guildConf.adminRole
        ) || message.author.id === this.client.options.ownerId;

      if (command.config.permissionLevel === 1 && !isMod) {
        return;
      }
      if (command.config.permissionLevel === 2 && !isAdmin) {
        return;
      }
    }

    await command.run(this.client, message, guildConf, params);
  }
}
