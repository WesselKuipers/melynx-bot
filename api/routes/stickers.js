import fs from 'fs';
import path from 'path';

const stickers = fs.readdirSync(
  path.resolve(__dirname, '../..', 'packages', 'bot', 'commands', 'stickers')
);

function getStickers(req, res) {
  return res.send(stickers);
}

export default router => {
  router.get('/stickers', getStickers);
};
