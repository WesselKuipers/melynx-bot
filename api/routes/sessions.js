function getGuildSession(db) {
  return async (req, res) => {
    const { guildId } = req.params;
    const sessions = guildId
      ? await db.models.session.findAll({
          where: { guildId },
          raw: true,
        })
      : await db.models.session.findAll({ raw: true });
    return res.send(sessions);
  };
}

export default (router, { db }) => {
  router.get('/sessions/:guildId(\\d+)?', getGuildSession(db));
};
