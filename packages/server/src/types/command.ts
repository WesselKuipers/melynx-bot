import { Message } from 'discord.js';
import { MelynxClient } from './melynxClient';

export enum PermissionLevel {
  Anyone = 0,
  Moderator = 1,
  Admin = 2,
}

export interface GuildConfig {
  guildId: string;
  prefix: string;
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

export default Command;
