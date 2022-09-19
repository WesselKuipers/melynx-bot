import { exampleRouter } from './routers/example';
import { sessionRouter } from './routers/session';
import { t } from './trpc';

export const appRouter = t.router({ example: exampleRouter, session: sessionRouter });

// export type definition of API
export type AppRouter = typeof appRouter;
