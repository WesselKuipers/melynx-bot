import { Collection, ClientOptions } from 'discord.js';
import Command, { GuildConfig } from './command';
import { AkairoClient, Command as AkairoCommand, CommandHandler } from 'discord-akairo';
import { Sequelize, ModelCtor, Model } from 'sequelize';
import { Message } from 'discord.js';
import SessionManager from '../bot/sessionManager';

export interface DbSettings extends Model {
  guildId: string;
  settings: GuildConfig;
}

export interface Tag extends Model {
  id: number;
  guildId: string;
  name: string;
  content: string;
}

export interface Role extends Model {
  id: string;
  guildId: string;
  name: string;
}

export interface Session extends Model {
  id: number;
  guildId: string;
  userId: string;
  avatar: string;
  creator: string;
  platform: 'Switch' | 'PC' | 'PS4' | 'XB1' | 'Rise' | 'Unknown';
  description: string;
  sessionId: string;
  channelId: string;
  date: Date;
  timer?: NodeJS.Timeout;
}

export interface FriendCode extends Model {
  id: string;
  fc: string;
}

export interface MelynxClient extends AkairoClient {
  commandHandler: CommandHandler;
  commands: Collection<string, Command>;
  aliases: Collection<string, Command>;
  db: Sequelize;
  options: ClientOptions & { ownerId: string; host: string };
  settings: { model: ModelCtor<DbSettings>; cache: Record<string, GuildConfig> };
  sessionManager: SessionManager;
  models: {
    tag: ModelCtor<Tag>;
    role: ModelCtor<Role>;
    session: ModelCtor<Session>;
    friendCode: ModelCtor<FriendCode>;
  };
  log: (message: string) => void;
  warn: (warning: string) => void;
  error: (error: Error) => void;
}

export class MelynxMessage extends Message {
  client: MelynxClient;
}

export class MelynxCommand extends AkairoCommand {
  client: MelynxClient;
  usage?: string;
}
