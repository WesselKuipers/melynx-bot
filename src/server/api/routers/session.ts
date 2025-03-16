import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { snowflakePattern } from '~/utils/regex';
import bot from '~/bot';
import { getUserGuilds } from '~/server/api/guilds';

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const sessionRouter = createTRPCRouter({
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const guilds = await getUserGuilds(ctx.session.user.id, ctx.session.user.accessToken);
    const sessions = await ctx.prisma.mhSession.findMany({
      where: {
        guildId: { in: guilds },
      },
    });

    return sessions;
  }),
  updateSession: protectedProcedure
    .input(
      z.object({
        id: z.string().regex(snowflakePattern),
        sessionId: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const dbSession = await prisma.mhSession.findFirst({
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

      const updatedSession = await prisma.mhSession.update({
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
  deleteSession: protectedProcedure
    .input(z.object({ id: z.string().regex(snowflakePattern) }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const dbSession = await prisma.mhSession.findFirst({
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

      await prisma.mhSession.delete({
        where: {
          id: dbSession.id,
        },
      });
    }),
});
