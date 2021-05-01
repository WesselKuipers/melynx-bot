import { GuildConfig } from '../../types/command';
import { MelynxClient, Session } from '../../types/melynxClient';

export const defaultSettings: GuildConfig = {
  guildId: '0',
  prefix: process.env.PREFIX,
  modRole: 'Moderator',
  adminRole: 'Administrator',
  sessionTimeout: 28800000, // 8 hours
  sessionRefreshTimeout: 300000, // 5 minutes
  sessionChannel: undefined,
  sessionChannelMessage: undefined,
  channelSettings: {},
};

export async function getGuildSettings(
  client: MelynxClient,
  guildId: string
): Promise<GuildConfig> {
  let settings = client.settings.cache?.[guildId];

  if (settings) {
    return settings;
  }

  const dbSettings = await client.settings.model.findByPk(guildId);
  if (!dbSettings) {
    settings = defaultSettings;
    await client.settings.model.create({
      guildId,
      settings,
    });
  } else {
    settings = dbSettings.settings;
  }

  client.settings.cache[guildId] = settings;
  return settings;
}

export function buildSessionMessage(guildId: string, sessions: Session[]): string[] {
  const sessionMessage = [];
  sessions
    .filter((s) => s.guildId === guildId)
    .map((s) => {
      const diff = (Date.now() - s.date.getTime()) / 1000 / 60;
      const hours = Math.floor(diff / 60);
      const minutes = Math.floor(diff % 60);

      sessionMessage.push(
        `(${hours ? `${hours}h ` : ''}${minutes}m ago by ${s.creator}) [${s.platform}]: \`${
          s.sessionId
        }\``
      );

      if (s.description) {
        sessionMessage.push(`> ${s.description}\n`);
      }

      return null;
    });

  if (!sessionMessage.length) {
    sessionMessage.push('There are no active sessions! Feel free to create one yourself!');
  }

  return sessionMessage;
}
