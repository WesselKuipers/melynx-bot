import { Client, Collection, ClientOptions } from 'discord.js';
import Command, { GuildConfig } from './command';
import { Sequelize, ModelCtor, Model } from 'sequelize';

export interface DbSettings extends Model {
  guildId: string;
  settings: GuildConfig;
}

export interface MelynxClient extends Client {
  defaultSettings: GuildConfig;
  commands: Collection<string, Command>;
  aliases: Collection<string, Command>;
  db: Sequelize;
  options: ClientOptions & { ownerId: string; host: string };
  settings: ModelCtor<DbSettings>;
  log: (message: string) => void;
  warn: (warning: string) => void;
  error: (error: Error) => void;
}
