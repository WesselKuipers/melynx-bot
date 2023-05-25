import { GuildConfig } from '../types';
import { MelynxClient, Session } from '../types';
import axios from 'axios';
import { prisma } from '../../server/db/client';

// These types are exported in @prisma/client, but there seem to be some issues when trying to import these.
type InputJsonValue = string | number | boolean | InputJsonObject | InputJsonArray;
type InputJsonObject = { readonly [Key in string]?: InputJsonValue | null };
interface InputJsonArray extends ReadonlyArray<InputJsonValue | null> {}

export const defaultSettings: GuildConfig = {
  guildId: '0',
  modRole: 'Moderator',
  adminRole: 'Administrator',
  sessionTimeout: 28800000, // 8 hours
  sessionRefreshTimeout: 300000, // 5 minutes
  sessionChannel: '',
  sessionChannelMessage: '',
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

  const dbSettings = await prisma.settings.findUnique({ where: { guildId } });
  if (!dbSettings) {
    settings = defaultSettings;
    await prisma.settings.create({
      data: {
        guildId,
        settings: settings as unknown as InputJsonObject,
      },
    });
  } else {
    // Prisma doesn’t allow for properly typed JSON fields.
    settings = dbSettings.settings as unknown as GuildConfig;
  }

  client.settings.cache[guildId] = settings;
  return settings;
}

export async function updateGuildSettings(
  client: MelynxClient,
  guildId: string,
  settings: GuildConfig
) {
  await prisma.settings.upsert({
    update: {
      settings: settings as unknown as InputJsonObject,
    },
    create: {
      settings: settings as unknown as InputJsonObject,
      guildId,
    },
    where: {
      guildId,
    },
  });

  // Update the cached settings
  client.settings.cache[guildId] = settings;
}

export function buildSessionMessage(guildId: string, sessions: Session[]): string {
  const sessionMessage = [];
  sessions
    .filter((s) => s.guildId === guildId)
    .map((s) => {
      const diff = (Date.now() - s.createdAt.getTime()) / 1000 / 60;
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

  return sessionMessage.join('\n');
}

export async function getCatFact() {
  return (await axios.get<{ fact: string }>('https://catfact.ninja/fact')).data;
}

export function formatTime(date: Date): string {
  // YYYY-MM-DD HH:mm:ss
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${pad(date.getUTCFullYear())}-${pad(date.getUTCMonth())}-${pad(date.getUTCDate())} ${pad(
    date.getUTCHours()
  )}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}
