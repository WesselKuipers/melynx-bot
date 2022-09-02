import { SlashCommandBuilder } from '@discordjs/builders';
import {
  Client,
  ClientOptions,
  Collection,
  CommandInteraction,
  Message,
  MessageComponentInteraction,
} from 'discord.js';
import { Session as PrismaSession, Settings as PrismaSettings } from '@prisma/client';

import SessionManager from '../sessionManager';

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

export interface Settings extends Omit<PrismaSettings, 'settings'> {
  settings: GuildConfig;
}

export interface Session extends PrismaSession {
  timer?: NodeJS.Timeout;
}

export interface MelynxClient extends Client {
  commands: Collection<string, MelynxCommand>;
  options: ClientOptions & { ownerId: string; host: string };
  settings: { cache: Record<string, GuildConfig> };
  sessionManager: SessionManager;
  log: (message: string) => void;
  warn: (warning: string) => void;
  error: (error: Error) => void;
}

export interface MelynxCommand {
  data: SlashCommandBuilder;
  execute(interaction: CommandInteraction, client: MelynxClient): Promise<void>;
  componentExecute?(interaction: MessageComponentInteraction, client: MelynxClient): Promise<void>;
}
