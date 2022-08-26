import { Router, Request, Response } from 'express';
import { getCatFact } from '../../utils';

async function catfact(_: Request, res: Response) {
  res.send(await getCatFact());
}

export default (router: Router) => {
  router.route('/catfact').get(catfact);
};
