import axios from 'axios';
import { Sequelize, Op } from 'sequelize';
import { Request, Response, Router } from 'express';
import { Guild } from 'discord.js';

function getGuildSession(db: Sequelize) {
  return async (req: Request<{ guildId: string }>, res: Response) => {
    const { guildId } = req.params;

    if (!req.headers.authorization) {
      return res.status(401).send('Unauthorized');
    }

    const { data } = await axios.get<Guild[]>('https://discordapp.com/api/users/@me/guilds', {
      headers: { Authorization: req.headers.authorization },
    });
    const guilds = data.map((g) => g.id);

    const sessions = guildId
      ? await db.models.session.findAll({
          where: { guildId },
          raw: true,
        })
      : await db.models.session.findAll({
          where: { guildId: { [Op.in]: guilds } },
          raw: true,
        });
    return res.send(sessions);
  };
}

export default (router: Router, { db }: { db: Sequelize }) => {
  router.get('/sessions/:guildId(\\d+)?', getGuildSession(db));
};
