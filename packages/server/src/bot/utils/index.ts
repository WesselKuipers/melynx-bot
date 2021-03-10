import { TextChannel } from 'discord.js';
import moment from 'moment';
import { GuildConfig } from '../../types/command';
import { MelynxClient, Session } from '../../types/melynxClient';

export async function getGuildSettings(
  client: MelynxClient,
  guildId: string
): Promise<GuildConfig> {
  let settings = client.settings.cache?.[guildId];

  if (settings) {
    return settings;
  }

  ({ settings } = await client.settings.model.findByPk(guildId));
  if (!settings) {
    settings = this.client.defaultSettings;
    await client.settings.model.create({
      guildId,
      settings,
    });
  }

  client.settings.cache[guildId] = settings;
  return settings;
}

export function buildSessionMessage(guildId: string, sessions: Session[]): string[] {
  const sessionMessage = [];
  sessions
    .filter((s) => s.guildId === guildId)
    .map((s) => {
      sessionMessage.push(
        `(${Math.floor(moment.duration(moment().diff(s.date)).asMinutes())}m ago by ${
          s.creator
        }) [${s.platform}]: ${s.sessionId} ${s.description}`
      );
      return null;
    });

  if (!sessionMessage.length) {
    sessionMessage.push('There are no active sessions! Feel free to create one yourself!');
  }

  return sessionMessage;
}
