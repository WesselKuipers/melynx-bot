import fs from 'fs';
import path from 'path';
import { Request, Response, Router } from 'express';

const stickers = fs.readdirSync(
  path.resolve(__dirname, '../..', 'packages', 'bot', 'commands', 'stickers')
);

function getStickers(req: Request, res: Response) {
  return res.send(stickers);
}

export default (router: Router) => {
  router.get('/stickers', getStickers);
};
