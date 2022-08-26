import axios from 'axios';
import { Router, Request, Response } from 'express';

async function catfact(_: Request, res: Response) {
  const { data } = await axios.get('https://cat-fact.herokuapp.com/facts/random');
  res.send(data);
}

export default (router: Router) => {
  router.route('/catfact').get(catfact);
};
