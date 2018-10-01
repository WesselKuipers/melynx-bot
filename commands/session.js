import Discord from 'discord.js';
import moment from 'moment';
import Sequelize from 'sequelize';

const pc = /\b3pseat[a-zA-Z0-9]{5}\b/;
const ps4 = /\b[a-zA-Z0-9]{12}\b/;
const sw = /\b\d{2}-\d{4}-\d{4}-\d{4}\b/;

let sessions = [];

/** @type {Sequelize.Model} */
let SessionDb;

export default class Session {
  constructor() {
    this.config = {
      enabled: true,
      aliases: ['ses', 's', 'sessions'],
      permissionLevel: 0,
      guildOnly: true,
      cooldown: 5,
    };

    this.help = {
      name: 'session',
      description: 'Lists all current sessions or adds one. Sessions expire after 8 hours.',
      usage: 'session | session [session id] [description] | session [remove|r] [session id]',
    };
  }

  /**
   * @param {Discord.Client} client 
   */
  async init(client) {
    client.defaultSettings.sessionTimeout = 28800000; // 8 hours
    client.defaultSettings.sessionRefreshTimeout = 5 * 60 * 1000; // 5 minutes

    /** @type {Sequelize.Sequelize} */
    const db = client.db;

    SessionDb = db.define('session', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      guildId: { type: Sequelize.STRING, notNull: true },
      creator: { type: Sequelize.STRING, notNull: true },
      platform: { type: Sequelize.STRING, notNull: true, contains: ['Switch', 'PC', 'PS4'] },
      description: Sequelize.STRING,
      sessionId: { type: Sequelize.STRING, unique: true, notNull: true },
      channelId: { type: Sequelize.STRING, notNull: true },
    }, { createdAt: 'date' });

    await SessionDb.sync();
    sessions = await SessionDb.findAll().map(async (session) => {
      const { prefix, sessionTimeout, sessionRefreshTimeout } = {...client.defaultSettings, ...((await client.settings.findById(session.guildId)).settings)};
      const channel = client.channels.get(session.channelId);

      session.timer = setTimeout(() => this.handleExpiredSession(client, channel, prefix, sessionTimeout, sessionRefreshTimeout, session), session.date - new Date() + sessionTimeout);
      return session;
    });
  }

  async listSessions(conf, channel) {
    const sessionMessage = [];
    const { prefix } = conf;

    sessions.filter(s => s.guildId === channel.guild.id).map(s => {
      sessionMessage.push(`(${Math.floor(moment.duration(moment().diff(s.date)).asMinutes())}m ago by ${s.creator}) [${s.platform}]: ${s.sessionId}${s.description}`);
    });

    if (!sessionMessage.length) {
      sessionMessage.push('There are no active sessions! Feel free to create one yourself! ' + prefix);
    }

    channel.send(sessionMessage, { split: true });
  }

  removeSession(id) {
    sessions = sessions.filter(item => item.id !== id);
    SessionDb.destroy({ where: { id }}).then(() => { return; });
  }

  async handleExpiredSession(client, channel, prefix, sessionTimeout, sessionRefreshTimeout, session) {
    const expireMessage = `Session ${session.sessionId} expired!`;

    this.removeSession(session.id);
    clearTimeout(session.timer);
    client.log(expireMessage);
    
    const sentMessage = await channel.send(`${expireMessage} React within 5 minutes ♻ to refresh this session!`);
    const reaction = await sentMessage.react('♻');
    const removeReactions = () => {
      sentMessage.edit(expireMessage);
      reaction.remove();
    };
    
    sentMessage.awaitReactions((reaction, user) => (reaction.emoji.name === '♻' && user.id !== client.user.id), { max: 1, time: sessionRefreshTimeout })
      .then((collected) => {
        const reactions = collected.first();

        if (sessions.some(s => s.sessionId === session.sessionId)) {
          removeReactions();
          return;
        }

        if (reactions.count === 0 || (reactions.count === 1 && reactions.first().me)) {
          removeReactions();
          return;
        }

        const refreshMessage = `Refreshed session ${session.sessionId}! ${prefix}`;
        channel.send(refreshMessage);

        SessionDb.create({ 
          guildId: session.guildId,
          creator: session.creator,
          channelId: channel.id,
          platform: session.platform,
          description: session.description,
          sessionId: session.sessionId })
          .then(dbSes => {
            dbSes.timer = setTimeout(() => this.handleExpiredSession(client, channel, prefix, sessionTimeout, sessionRefreshTimeout, dbSes), sessionTimeout);
            sessions.push(dbSes);
            client.log(refreshMessage);

            removeReactions();
          });
      })
      .catch(() => {
        removeReactions();
      });
  }

  async run(client, message, conf, params) {
    if (!params.length) {
      this.listSessions(conf, message.channel);
      return;
    }

    const joinedParams = params.join(' ');
    const foundPC = pc.exec(joinedParams);
    const foundPS4 = ps4.exec(joinedParams);
    const foundSwitch = sw.exec(joinedParams);
    
    const { prefix, sessionTimeout, sessionRefreshTimeout } = { ...client.defaultSettings, ...conf };

    if (params[0] === 'r' || params[0] === 'remove') {
      const sessionId = params[1];
      const session = sessions.find(ses => ses.sessionId === sessionId);

      if (!session || session.guildId !== message.guild.id) {
        message.channel.send('A session with that ID does not exist, nya...');
        return;
      }

      this.removeSession(session.id);
      clearTimeout(session.timer);
      message.channel.send(`Remeowved session ${session.sessionId}! ${prefix}`);
      return;
    }

    if (!foundPC && !foundPS4 && !foundSwitch) {
      message.channel.send('Couldn\'t find any sessions, nya...');
      return;
    }

    let session = {
      creator: message.author.username,
      date: moment(),
      guildId: message.guild.id,
    };

    if (foundPC) {
      session.sessionId = foundPC[0];
      session.description = foundPC.input.slice(foundPC[0].length + foundPC.index);
      session.platform = 'PC';
    }

    if (foundSwitch) {
      session.sessionId = foundSwitch[0];
      session.description = foundSwitch.input.slice(foundSwitch[0].length + foundSwitch.index);
      session.platform = 'Switch';
    }

    if (foundPS4 && !foundPC) {
      session.sessionId = foundPS4[0];
      session.description = foundPS4.input.slice(foundPS4[0].length + foundPS4.index);
      session.platform = 'PS4';
    }

    if (sessions.some(s => s.sessionId === session.sessionId && s.guildId === message.guild.id)) {
      message.channel.send('A lobby with this ID already exists!');
      return;
    }

    message.channel.send(`Added ${session.platform} session ${session.sessionId}! ${prefix}`);

    // see: http://www.asciitable.com/
    session.description = session.description.replace(/[^\x20-\x9A]|[<@>]/g, '').slice(0, 100);
    let dbSes = await SessionDb.create({ 
      guildId: session.guildId,
      creator: session.creator,
      channelId: message.channel.id,
      platform: session.platform,
      description: session.description,
      sessionId: session.sessionId,
    });

    dbSes.timer = setTimeout(() => this.handleExpiredSession(client, message.channel, prefix, sessionTimeout, sessionRefreshTimeout, dbSes), sessionTimeout); // auto clear after (default) 8 hours;

    sessions.push(dbSes);
  }
}
