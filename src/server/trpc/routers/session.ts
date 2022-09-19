import axios from 'axios';
import { protectedMiddleware } from '../middleware/protected';
import { t } from '../trpc';
import { Routes, RouteBases, RESTGetAPICurrentUserGuildsResult } from 'discord-api-types/v10';

export const sessionRouter = t.router({
  getSessions: t.procedure.use(protectedMiddleware).query(async ({ ctx }) => {
    const { data } = await axios.get<RESTGetAPICurrentUserGuildsResult>(
      `${RouteBases.api}/${Routes.userGuilds()}`,
      {
        headers: {
          authorization: 'Bearer ' + ctx.session.user.accessToken,
        },
      }
    );

    const guilds = data.map((g) => g.id);
    const sessions = await ctx.prisma.session.findMany({
      where: {
        guildId: { in: guilds },
      },
    });

    return sessions;
  }),
});
