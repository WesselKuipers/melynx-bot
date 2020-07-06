import { Router } from 'express';

import * as routes from './routes';

export default params => {
  const apiRouter = new Router();
  Object.values(routes).map(route => route(apiRouter, params));
  apiRouter.get('/*', (_, res) => {
    res.status(404).send('Not found');
  });

  return apiRouter;
};
