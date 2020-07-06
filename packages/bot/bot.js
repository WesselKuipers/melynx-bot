import Discord from 'discord.js';
import moment from 'moment';
import Sequelize from 'sequelize';

import * as commands from './commands';

const regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const playingLines = [
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

export default class MelynxBot {
  constructor(settings) {
    this.settings = settings;

    this.client = new Discord.Client(settings);
    this.commands = new Discord.Collection();
    this.aliases = new Discord.Collection();

    const db = new Sequelize(settings.databaseUrl, { logging: false });
    const guildSettings = db.define('settings', {
      guildId: { type: Sequelize.STRING, unique: true, primaryKey: true },
      settings: Sequelize.JSON,
    });

    this.client.db = db;
    this.client.settings = guildSettings;

    this.client.defaultSettings = {
      prefix: settings.prefix,
      modRole: 'Moderator',
      adminRole: 'Administrator',
    };

    this.log = (message) => {
      // eslint-disable-next-line no-console
      console.log(
        `[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${message.replace(regToken, '[TOKEN]')}`
      );
    };

    this.error = (error) => {
      this.log(`Error: ${error.message}`);
    };

    this.warn = (warning) => {
      this.log(`Warning: ${warning}`);
    };

    this.client.log = this.log;
    this.client.warn = this.warn;
    this.client.error = this.error;
  }

  run() {
    this.client.login(this.settings.token);

    this.client.on('ready', () => {
      this.log(
        `Connected to ${this.client.users.cache.size} users on ${this.client.guilds.cache.size} servers.`
      );
      this.loadCommands();

      this.client.user.setPresence({
        status: 'online',
        game: playingLines[Math.floor(Math.random() * playingLines.length)],
      });
      this.client.settings.sync();
    });

    this.client.on('guildDelete', (guild) => {
      // When the bot leaves or is kicked, delete settings to prevent stale entries.
      this.log(`Left guild ${guild.id} (${guild.name})`);
      this.client.settings.destroy({ where: { guildId: guild.id } });
    });

    this.client.on('error', (error) => this.error(error));
    this.client.on('warn', (warning) => this.warn(warning));
    this.client.on('message', (message) => this.message(message));
  }

  async loadCommands() {
    await Promise.all(
      Object.values(commands).map(async (Command) => {
        const command = new Command();
        // If command has an init method, run it
        if (command.init) {
          this.log(`Running init of ${command.help.name}`);
          await command.init(this.client);
        }

        // Assign the main command name to commands, as well as all of its aliases
        this.commands.set(command.help.name, command);
        if (command.config.aliases) {
          command.config.aliases.forEach((alias) => {
            if (this.aliases.has(alias)) {
              this.log(
                `Warning: Command ${command.help.name} alias ${alias} overlaps with command ${
                  this.aliases.get(alias).help.name
                }.\r\nOld alias will be overwritten.`
              );
            }

            this.aliases.set(alias, command);
          });
        }

        this.log(
          `Loaded command [${command.help.name}] with aliases [${command.config.aliases.join(
            ', '
          )}]`
        );
      })
    );

    this.client.commands = this.commands;
    this.client.aliases = this.aliases;
  }

  /**
   *
   * @param {Discord.Message} message
   */
  async message(message) {
    if (message.author === this.client.user) {
      return; // don't respond to yourself
    }

    let guildConfEntry;

    if (message.guild) {
      guildConfEntry = await this.client.settings.findByPk(message.guild.id);
    } else {
      guildConfEntry = this.client.defaultSettings;
    }

    if (!guildConfEntry && message.guild) {
      guildConfEntry = await this.client.settings.create({
        guildId: message.guild.id,
        settings: this.client.defaultSettings,
      });
      this.log(`Initialized config for guild ${message.guild.id}`);
    }

    const guildConf = {
      ...this.defaultSettings,
      ...guildConfEntry.get('settings'),
    };
    const prefixRegex = new RegExp(
      `^(<@!?${this.client.user.id}>|${escapeRegex(guildConf.prefix)})\\s*`
    );

    if (!prefixRegex.test(message.content)) {
      return; // doesn't start with prefix or mention, don't care what the message is
    }

    if (message.content.split(/ +/).length === 1) {
      return; // usage of mention or prefix without a command
    }

    const commandName = message.content.split(/ +/)[1].toLowerCase();
    const params = message.content.split(/ +/).slice(2);

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
