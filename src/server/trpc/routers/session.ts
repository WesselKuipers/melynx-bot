import axios from 'axios';
import { protectedMiddleware } from '../middleware/protected';
import { t } from '../trpc';
import { Routes, RouteBases, RESTGetAPICurrentUserGuildsResult } from 'discord-api-types/v10';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { snowflakePattern } from '../../../utils/regex';
import bot from '../../../bot';
import { getUserGuilds } from '../../api/guilds';

export const sessionRouter = t.router({
  getSessions: t.procedure.use(protectedMiddleware).query(async ({ ctx }) => {
    const guilds = await getUserGuilds(ctx.session.user.id, ctx.session.user.accessToken);
    const sessions = await ctx.prisma.session.findMany({
      where: {
        guildId: { in: guilds },
      },
    });

    return sessions;
  }),
  updateSession: t.procedure
    .use(protectedMiddleware)
    .input(
      z.object({
        id: z.string().regex(snowflakePattern),
        sessionId: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const dbSession = await prisma.session.findFirst({
        where: {
          sessionId: input.id,
        },
      });

      if (!dbSession) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found.' });
      }

      if (dbSession.userId !== session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the session’s creator may edit sessions.',
        });
      }

      const updatedSession = await prisma.session.update({
        where: {
          id: dbSession.id,
        },
        data: {
          description: input.description,
          sessionId: input.sessionId,
        },
      });

      await bot.client.sessionManager.updateSession(updatedSession);
      return updatedSession;
    }),
  deleteSession: t.procedure
    .use(protectedMiddleware)
    .input(z.object({ id: z.string().regex(snowflakePattern) }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const dbSession = await prisma.session.findFirst({
        where: {
          sessionId: input.id,
        },
      });

      if (!dbSession) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found.',
        });
      }

      if (dbSession.userId !== session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the session’s creator may delete sessions.',
        });
      }

      await prisma.session.delete({
        where: {
          id: dbSession.id,
        },
      });
    }),
});
