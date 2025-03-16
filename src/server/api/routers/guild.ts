import { getOverlappingGuilds } from '~/server/api/guilds';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const guildRouter = createTRPCRouter({
  getGuilds: protectedProcedure.query(({ ctx }) =>
    getOverlappingGuilds(ctx.session.user.id, ctx.session.user.accessToken)
  ),
});
