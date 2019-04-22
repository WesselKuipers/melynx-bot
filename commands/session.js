import Discord from 'discord.js';
import moment from 'moment';
import Sequelize from 'sequelize';
import dotProp from 'dot-prop';

const mhwRegex = /\b[a-zA-Z0-9]{11,12}\b/;
const mhguRegex = /\b\d{2}-\d{4}-\d{4}-\d{4}\b/;

let sessions = [];

/** @type {Sequelize.Model} */
let SessionDb;

const sessionChannelTimers = {};

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
      description: 'Lists all current sessions or adds one. Sessions expire automatically after 8 hours.',
      usage: 'session (lists current sessions)\nsession [session id] [description] (Adds a new session)\nsession [remove|r] [session id] (Removes a session)',
    };
  }

  /**
   * @param {Discord.Client} client 
   */
  async init(client) {
    client.defaultSettings.sessionTimeout = 28800000; // 8 hours
    client.defaultSettings.sessionRefreshTimeout = 5 * 60 * 1000; // 5 minutes
    client.defaultSettings.sessionChannel = undefined;
    client.defaultSettings.channelSettings = {};

    /** @type {Sequelize.Sequelize} */
    const db = client.db;

    SessionDb = db.define('session', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      guildId: { type: Sequelize.STRING, notNull: true },
      creator: { type: Sequelize.STRING, notNull: true },
      platform: { type: Sequelize.STRING, notNull: true, contains: ['Switch', 'PC', 'PS4', 'XB1', 'Unknown'] },
      description: Sequelize.STRING,
      sessionId: { type: Sequelize.STRING, unique: true, notNull: true },
      channelId: { type: Sequelize.STRING, notNull: true },
    }, { createdAt: 'date' });

    await SessionDb.sync();
    sessions = await SessionDb.findAll().map(async (session) => {
      const conf = {...client.defaultSettings, ...((await client.settings.findByPk(session.guildId)).settings)};
      const { prefix, sessionTimeout, sessionRefreshTimeout } = conf;
      const channel = client.channels.get(session.channelId);
      
      client.log('Restoring session: ' + session.sessionId);
      const posted = session.date.getTime();
      const now = new Date().getTime();
      const remaining = posted - now + Number(sessionTimeout);

      session.timer = setTimeout(() => this.handleExpiredSession(client, channel, prefix, sessionTimeout, sessionRefreshTimeout, session), remaining);
      return session;
    });

    const guilds = await client.settings.findAll();
    
    guilds.map( ({ guildId, settings }) => {
      if (settings.sessionChannel && !sessionChannelTimers[guildId]) {
        const timer = setInterval(async () => await this.updateSessionMessage(client, settings), 5 * 60 * 1000);
        sessionChannelTimers[guildId] = timer;
        this.updateSessionMessage(client, settings);
      }
    });
  }

  buildSessionMessage(conf, channel) {
    const { prefix } = conf;
    const sessionMessage = [];

    sessions.filter(s => s.guildId === channel.guild.id).map(s => {
      sessionMessage.push(`(${Math.floor(moment.duration(moment().diff(s.date)).asMinutes())}m ago by ${s.creator}) [${s.platform}]: ${s.sessionId}${s.description}`);
    });

    if (!sessionMessage.length) {
      sessionMessage.push('There are no active sessions! Feel free to create one yourself! ' + prefix);
    }

    return sessionMessage;
  }

  async listSessions(conf, channel) {
    const sessionMessage = this.buildSessionMessage(conf, channel);
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

  async createSessionMessage(client, conf, channel) {
    const sessionChannelMessage = await channel.send(this.buildSessionMessage(conf, channel), {split: true});
        await client.settings.update({ 
          settings: { 
            ...conf,
            sessionChannelMessage: sessionChannelMessage.id 
          }
        }, { where: { guildId: channel.guild.id }});

    return sessionChannelMessage;
  }

  /**
   * 
   * @param {Discord.Client} client 
   * @param {Object} conf 
   */
  async updateSessionMessage(client, conf) {
    if (conf.sessionChannel) {
      /**
       * @type {Discord.TextChannel}
       */
      const channel = client.channels.find(channel => channel.id === conf.sessionChannel.replace(/<|#|>/g, ''));

      if (!conf.sessionChannelMessage) {
        await this.createSessionMessage(client, conf, channel);
      } else {
        try {
        const sessionChannelMessage = await channel.fetchMessage(conf.sessionChannelMessage);
        sessionChannelMessage.edit(this.buildSessionMessage(conf, channel).join('\n'));
        } catch (e) {
          await this.createSessionMessage(client, conf, channel);
        }
      }
    }
  }

  /**
   * 
   * @param {Discord.Client} client 
   * @param {Discord.Message} message 
   * @param {Object} conf 
   * @param {string[]} params 
   */
  async run(client, message, conf, params) {
    if (conf.sessionChannel && !sessionChannelTimers[message.guild.id]) {
      const timer = setInterval(async () => await this.updateSessionMessage(client, conf), 5 * 60 * 1000);
      sessionChannelTimers[message.guild.id] = timer;
    }

    if (!params.length) {
      this.listSessions(conf, message.channel);
      return;
    }    

    const joinedParams = params.join(' ');
    const foundMHW = mhwRegex.exec(joinedParams);
    const foundMHGU = mhguRegex.exec(joinedParams);
    
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
      await this.updateSessionMessage(client, conf);
      return;
    }

    if (!foundMHW && !foundMHGU) {
      message.channel.send('Couldn\'t find any sessions, nya...');
      return;
    }

    const session = {
      creator: message.author.username,
      date: moment(),
      guildId: message.guild.id,
    };

    if (foundMHW) {
      session.sessionId = foundMHW[0];
      session.description = foundMHW.input.slice(foundMHW[0].length + foundMHW.index);
      session.platform = dotProp.get(conf, `channelSettings.${message.channel.id}.platform`) || (message.channel.name.toUpperCase().contains("PS4") && "PS4") || (message.channel.name.toUpperCase().contains("PC") && "PC") || (message.channel.name.toUpperCase().contains("XB1") && "XB1")
    }

    if (foundMHGU) {
      session.sessionId = foundMHGU[0];
      session.description = foundMHGU.input.slice(foundMHGU[0].length + foundMHGU.index);
      session.platform = 'Switch';
    }

    if (sessions.some(s => s.sessionId === session.sessionId && s.guildId === message.guild.id)) {
      message.channel.send('A lobby with this ID already exists!');
      return;
    }

    if (!session.platform) {
      message.channel.send('Could not determine the session\'s platform..');
      session.platform = 'Unknown';
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
    await this.updateSessionMessage(client, conf);
  }
}
