import { t } from '../trpc';

export const exampleRouter = t.router({
  greeting: t.procedure.query(() => 'Hello world!'),
});
