import { Router } from 'express';
import { Sequelize } from 'sequelize';

import { ApplicationSettings } from '../bot';
import * as routes from './routes';

export function API(params: { options: ApplicationSettings; db: Sequelize }) {
  // eslint-disable-next-line new-cap
  const apiRouter = Router();
  for (const route of Object.values(routes)) {
    route(apiRouter, params);
  }
  apiRouter.get('/*', (_, res) => {
    res.status(404).send('Not found');
  });

  return apiRouter;
}

export default API;
