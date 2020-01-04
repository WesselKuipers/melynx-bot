import axios from 'axios';

function getGuildSession(db) {
  return async (req, res) => {
    const { guildId } = req.params;

    if (!req.headers.authorization) {
      return res.status(401).send('Unauthorized');
    }

    const { data } = await axios.get('https://discordapp.com/api/users/@me/guilds', { headers: { 'Authorization': req.headers.authorization } });
    const guilds = data.map(g => g.id);

    const sessions = guildId
      ? await db.models.session.findAll({
        where: { guildId },
        raw: true,
      })
      : await db.models.session.findAll({ where: { guildId: { [db.Sequelize.Op.in]: guilds } }, raw: true });
    return res.send(sessions);
  };
}

export default (router, { db }) => {
  router.get('/sessions/:guildId(\\d+)?', getGuildSession(db));
};
