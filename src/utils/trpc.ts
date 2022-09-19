import { httpBatchLink, loggerLink } from '@trpc/react';
import type { AppRouter } from '../server/trpc';
import { createTRPCNext } from '@trpc/next';
import superjson from 'superjson';

export const trpc = createTRPCNext<AppRouter>({
  config() {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    // const url = env.HOST ? `https://${env.HOST}/api/trpc` : 'http://localhost:3000/api/trpc';
    const url = 'http://localhost:3000/api/trpc';

    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({ url }),
      ],
      url,
      transformer: superjson,
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      // queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: false,
});
