import trpc from '@trpc/server';
import trpcNext from '@trpc/server/adapters/next';
import { NextApiRequest } from 'next';
import { Session, unstable_getServerSession as getServerSession } from 'next-auth';
import { authOptions as nextAuthOptions } from '../../pages/api/auth/[...nextauth]';
import { prisma } from '../db/client';

type CreateContextOptions = {
  session: Session | null;
  req: NextApiRequest;
};

/** Use this helper for:
 * - testing, where we don’t have to Mock Next.js' req/res
 * - trpc’s `createSSGHelpers` where we don't have req/res
 **/
export const createContextInner = async (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
    req: opts.req,
  };
};

/**
 * This is the actual context you’ll use in your router
 * @link https://trpc.io/docs/context
 **/
export const createContext = async (opts: trpcNext.CreateNextContextOptions) => {
  const session = await getServerSession(opts.req, opts.res, nextAuthOptions);
  // console.log('createContext', session);

  return await createContextInner({
    session,
    req: opts.req,
  });
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
