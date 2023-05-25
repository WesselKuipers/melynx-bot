import { TRPCError } from '@trpc/server';
import { t } from '../trpc';

/**
 * Creates a tRPC middleware that asserts all queries and mutations are from an authorized user.
 * Will throw an unauthorized error if a user is not signed in.
 */
export const protectedMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      // infers that `session` is non-nullable to downstream resolvers
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
