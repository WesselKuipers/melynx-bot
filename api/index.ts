import { Router } from 'express';

import * as routes from './routes';
import { Sequelize } from 'sequelize';
import { ApplicationSettings } from '../packages/bot/bot';

export function API(params: { options: ApplicationSettings; db: Sequelize }) {
  const apiRouter = Router();
  Object.values(routes).map((route) => route(apiRouter, params));
  apiRouter.get('/*', (_, res) => {
    res.status(404).send('Not found');
  });

  return apiRouter;
}
