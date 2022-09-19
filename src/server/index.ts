import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import bot from '../bot';

const port = parseInt(process.env.PORT || '3000');
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port);

  bot.run();

  // tslint:disable-next-line:no-console
  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? 'development' : process.env.NODE_ENV
    }`
  );
});
