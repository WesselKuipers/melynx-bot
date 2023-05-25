import axios from 'axios';
import { RESTGetAPICurrentUserGuildsResult, RouteBases, Routes } from 'discord.js';
import bot from '../../bot';

// A cache is kept to prevent hitting Discord’s APIs too often.
export const userGuilds = new Map<string, { guilds: string[]; fetched: Date }>();

export async function getUserGuilds(userId: string, accessToken: string) {
  const cachedEntry = userGuilds.get(userId);
  let guilds = cachedEntry?.guilds;

  if (
    !guilds?.length ||
    (cachedEntry && cachedEntry.fetched.getTime() - Date.now() > 10 * 60 * 1000)
  ) {
    const { data } = await axios.get<RESTGetAPICurrentUserGuildsResult>(
      `${RouteBases.api}/${Routes.userGuilds()}`,
      {
        headers: {
          authorization: 'Bearer ' + accessToken,
        },
      }
    );

    guilds = data.map((g) => g.id);
    userGuilds.set(userId, { guilds, fetched: new Date() });
  }

  return guilds;
}

export async function getOverlappingGuilds(userId: string, accessToken: string) {
  const userGuilds = await getUserGuilds(userId, accessToken);
  const melynxGuilds = bot.client.guilds.cache.map((g) => ({ id: g.id, name: g.name }));

  return melynxGuilds.filter((g) => userGuilds.includes(g.id));
}
