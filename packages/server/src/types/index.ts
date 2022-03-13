import { SlashCommandBuilder } from '@discordjs/builders';
import {
  Client,
  ClientOptions,
  Collection,
  CommandInteraction,
  Message,
  MessageComponentInteraction,
} from 'discord.js';
import { Model, ModelCtor, Sequelize } from 'sequelize';

import SessionManager from '../bot/sessionManager';

export enum PermissionLevel {
  Anyone = 0,
  Moderator = 1,
  Admin = 2,
}

export interface Command {
  config: {
    guildOnly: boolean;
    ownerOnly: boolean;
    aliases: string[];
    permissionLevel: PermissionLevel;
    enabled: boolean;
  };

  help: {
    name: string;
    description: string;
    usage: string;
  };

  run: (
    client: MelynxClient,
    message: Message,
    guildConf: GuildConfig,
    params: string[]
  ) => Promise<void>;

  init?: (client: MelynxClient) => Promise<void>;
}

export interface GuildConfig {
  guildId: string;
  modRole: string;
  adminRole: string;
  sessionTimeout: number;
  sessionRefreshTimeout: number;
  sessionChannel: string;
  sessionChannelMessage: string;
  channelSettings: {
    [channelId: string]: {
      platform: 'PS4' | 'PC' | 'Switch' | 'XB1' | 'Rise';
    };
  };
}

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
  description: string;
}

export interface Session extends Model {
  id: number;
  guildId: string;
  userId: string;
  avatar: string;
  creator: string;
  platform: string;
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

export interface MelynxClient extends Client {
  commands: Collection<string, MelynxCommand>;
  db: Sequelize;
  options: ClientOptions & { ownerId: string; host: string };
  settings: { model: ModelCtor<DbSettings>; cache: Record<string, GuildConfig> };
  sessionManager: SessionManager;
  models: Models;
  log: (message: string) => void;
  warn: (warning: string) => void;
  error: (error: Error) => void;
}

export interface Models {
  tag: ModelCtor<Tag>;
  role: ModelCtor<Role>;
  session: ModelCtor<Session>;
  friendCode: ModelCtor<FriendCode>;
}

export interface MelynxCommand {
  data: SlashCommandBuilder;
  execute(interaction: CommandInteraction, client: MelynxClient): Promise<void>;
  componentExecute?(interaction: MessageComponentInteraction, client: MelynxClient): Promise<void>;
}
