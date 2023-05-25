import { createNextApiHandler } from '@trpc/server/adapters/next';

import { appRouter } from '../../../server/trpc';
import { createContext } from '../../../server/trpc/context';

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error, type, path, input, ctx, req }) {
    console.error('Error:', error);
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      // send to bug reporting
    }
  },
});
