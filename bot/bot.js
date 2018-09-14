import Discord from 'discord.js';

import fs from 'fs';
import moment from 'moment';

import es6 from 'es6-promise';

es6.polyfill();

const regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;

export default class CFGBot {
  constructor(settings) {
    this.settings = settings;
    this.client = new Discord.Client(settings);
    this.commands = new Discord.Collection();
    this.aliases = new Discord.Collection();
    
    this.loadCommands();
  }

  run() {
    this.client.login(this.settings.token);

    this.client.on('ready', () => {
      this.log(`Connected to ${this.client.users.size} users on ${this.client.guilds.size} servers.`);
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
        // this.log(`loading ${f}`);

        const command = require(`../commands/${f}`);
        const c = new command.default();

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

  message(message) {
    if (!message.content.startsWith(this.settings.prefix)) {
      return; // doesn't start with prefix, don't care what the message is
    }

    if (message.author === this.client.user) {
      return; // don't respond to yourself
    }

    const commandName = message.content.split(/ +/)[1].toLowerCase(); // .slice(this.settings.prefix.length);
    const params = message.content.split(/ +/).slice(2); // .slice(1);

    const command = this.commands.get(commandName) || this.aliases.get(commandName);
    if (!command) return;

    if (command.config.guildOnly && message.channel.type !== 'text' ) {
      return; 
    }

    command.run(this.client, message, params);
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
