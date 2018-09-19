import Discord from 'discord.js';

import fs from 'fs';
import moment from 'moment';

import es6 from 'es6-promise';
import Sequelize from 'sequelize';

es6.polyfill();

const regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
const playingLines = [
  'stealing gems from hunters',
  'with a hunter',
  'smoking felvine',
  'the hunting horn',
  'with your palico',
  'with the Meowstress',
  'with the Mewstress',
];

export default class CFGBot {
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
    this.client.log = this.log;

    this.client.defaultSettings = {
      prefix: settings.prefix,
      modRole: 'Moderator',
      adminRole: 'Administrator',
    };
    
    this.loadCommands();
  }

  run() {
    this.client.login(this.settings.token);

    this.client.on('ready', () => {
      this.log(`Connected to ${this.client.users.size} users on ${this.client.guilds.size} servers.`);
      this.client.user.setPresence({status: 'online', game: {name: playingLines[Math.floor(Math.random() * playingLines.length)], type: 'PLAYING' }});
      this.client.settings.sync();
    });

    this.client.on('guildDelete', guild => {
      // When the bot leaves or is kicked, delete settings to prevent stale entries.
      this.client.settings.delete(guild.id);
    });

    this.client.on('error', error => this.error(error));
    this.client.on('warn', warning => this.warn(warning));
    this.client.on('message', message => this.message(message));
  }

  loadCommands() {
    fs.readdir('./commands', (error, files) => {
      if (error) {
        this.log.error(error);
      }

      this.log(`Loading ${files.length} commands: ${files}`);

      files.filter(n => n.endsWith('.js')).forEach((f) => {
        const command = require(`../commands/${f}`);
        const c = new command.default();

        // If command has an init method, run it
        if (c.init) {
          this.log('Running init of ' + c.help.name);
          c.init(this.client);
        }

        // Assign the main command name to commands, as well as all of its aliases
        this.commands.set(c.help.name, c);
        if (c.config.aliases) {
          c.config.aliases.forEach((alias) => {
            if (this.aliases.has(alias)) {
              this.log(`Warning: Command ${c.help.name} alias ${alias} overlaps with command ${this.aliases.get(alias).help.name}.\r\nOld alias will be overwritten.`);
            }

            this.aliases.set(alias, c);
          });
        }

        this.log(`Loaded command [${c.help.name}] with aliases [${c.config.aliases.join(', ')}]`);
      });
    });

    this.client.commands = this.commands;
  }

  async message(message) {
    if (message.author === this.client.user) {
      return; // don't respond to yourself
    }

    let guildConfEntry = await this.client.settings.findById(message.guild.id);

    if (!guildConfEntry) {
      guildConfEntry = await this.client.settings.create({ guildId: message.guild.id, settings: this.client.defaultSettings});
      this.log('Initialized config for guild ' + message.guild.id);
    }

    const guildConf = guildConfEntry.get('settings');

    if (!message.content.startsWith(guildConf.prefix)) {
      return; // doesn't start with prefix, don't care what the message is
    }

    if (message.content.startsWith(guildConf.prefix) && message.content.length === guildConf.prefix.length) {
      return; // someone only said the prefix and nothing else
    }

    const commandName = message.content.split(/ +/)[1].toLowerCase(); // .slice(this.settings.prefix.length);
    const params = message.content.split(/ +/).slice(2); // .slice(1);

    const command = this.commands.get(commandName) || this.aliases.get(commandName);
    if (!command) return;

    if (command.config.guildOnly && message.channel.type !== 'text' ) {
      return; 
    }

    if (command.config.ownerOnly && message.author.id !== '86708235888783360') {
      return;
    }

    command.run(this.client, message, guildConf, params);
  }
  

  log(message) {
    // eslint-disable-next-line no-console
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${message}`);
  }

  error(error) {
    // Logging all errors by default
    this.log(`Error: ${error.message.replace(regToken, '[TOKEN]')}`);
  }

  warn(warning) {
    this.log(`Warning: ${warning.replace(regToken, '[TOKEN]')}`);
  }
}
