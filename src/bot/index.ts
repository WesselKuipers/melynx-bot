import {
  Collection,
  ActivityOptions,
  Client,
  Interaction,
  ActivityType,
  Partials,
  GatewayIntentBits,
} from 'discord.js';
import * as commands from './commands';
import { MelynxClient } from './types';
import SessionManager from './sessionManager';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import env from '../server/env';
import { prisma } from '../server/db/client';
import { formatTime } from './utils';

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
  console.log(`[${formatTime(new Date())}] ${message.replace(regToken, '[TOKEN]')}`);
}

function error(error: Error) {
  log(`Error: ${error.message}`);
}

function warn(warning: string) {
  log(`Warning: ${warning}`);
}

export class MelynxBot {
  client: MelynxClient;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
      ],
      partials: [Partials.Channel, Partials.Message, Partials.Reaction],
    }) as MelynxClient;
    this.client.options.ownerId = env.OWNER_ID;
    this.client.options.host = env.HOST;

    const isDev = process.env.NODE_ENV !== 'production';
    log(`Starting bot in ${isDev ? 'dev' : 'production'} mode`);

    this.client.settings = { cache: {} };

    this.client.log = log;
    this.client.warn = warn;
    this.client.error = error;

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
    const rest = new REST({ version: '9' }).setToken(env.TOKEN);
    const body = this.client.commands.map((command) => command.data.toJSON());

    if (isDev) {
      this.client.log(`Refreshing ${this.client.commands.size} commands for devServer`);
      await rest.put(Routes.applicationGuildCommands(env.CLIENT_ID, env.DEV_SERVER), { body });
    } else {
      this.client.log(`Refreshing ${this.client.commands.size} commands globally`);
      await rest.put(Routes.applicationCommands(env.CLIENT_ID), { body });
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
      await this.client.commands.get(interaction.commandName)?.execute(interaction, client);
    } catch (error) {
      this.client.error(error as Error);
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
    this.client.login(env.TOKEN);

    this.client.on('ready', async () => {
      this.client.log(`Connected to ${this.client.guilds.cache.size} servers.`);
      this.client.user!.setActivity(playingLines[Math.floor(Math.random() * playingLines.length)]);

      await this.registerCommands();
      await this.client.sessionManager.init(this.client);
    });

    this.client.on('guildDelete', (guild) => {
      // When the bot leaves or is kicked, delete settings to prevent stale entries.
      this.client.log(`Left guild ${guild.id} (${guild.name})`);
      prisma.settings.delete({ where: { guildId: guild.id } });
    });

    this.client.on('error', (error) => this.client.error(error));
    this.client.on('warn', (warning) => this.client.warn(warning));
  }
}

const bot = new MelynxBot();
export default bot;
