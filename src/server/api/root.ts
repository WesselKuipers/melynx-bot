import { createTRPCRouter } from '~/server/api/trpc';
import { exampleRouter } from '~/server/api/routers/example';
import { sessionRouter } from '~/server/api/routers/session';
import { guildRouter } from '~/server/api/routers/guild';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  session: sessionRouter,
  guild: guildRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
