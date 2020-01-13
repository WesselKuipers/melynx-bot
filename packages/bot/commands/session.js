import Discord from 'discord.js';
import dotProp from 'dot-prop';
import moment from 'moment';
import Sequelize from 'sequelize';

const iceborneRegex = /[a-zA-Z0-9#]{4} [a-zA-Z0-9]{4} [a-zA-Z0-9]{4}/;
const pcRegex = /[a-zA-Z0-9#+?@$#&!=-]{12}/;
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
      description:
        'Lists all current sessions or adds one. Sessions expire automatically after 8 hours.',
      usage:
        '\n{prefix} session (lists current sessions)\n{prefix} session [session id] [description] (Adds a new session)\n{prefix} session [remove|r] [session id] (Removes a session)',
    };

    this.buildSessionMessage = (conf, channel) => {
      const { prefix } = conf;
      const sessionMessage = [];

      sessions
        .filter(s => s.guildId === channel.guild.id)
        .map(s => {
          sessionMessage.push(
            `(${Math.floor(
              moment.duration(moment().diff(s.date)).asMinutes()
            )}m ago by ${s.creator}) [${s.platform}]: ${s.sessionId} ${
              s.description
            }`
          );
          return null;
        });

      if (!sessionMessage.length) {
        sessionMessage.push(
          `There are no active sessions! Feel free to create one yourself! ${prefix}`
        );
      }

      return sessionMessage;
    };

    this.removeSession = id => {
      sessions = sessions.filter(item => item.id !== id);
      SessionDb.destroy({ where: { id } }).then(() => {});
    };

    this.removeSessionChannel = async (client, conf) => {
      client.log(`Removing session channel on guild: ${conf.guildId}`);
      await client.settings.update(
        {
          settings: {
            ...conf,
            sessionChannel: '',
            sessionChannelMessage: null,
          },
        },
        { where: { guildId: conf.guildId } }
      );
    };

    this.init = async client => {
      client.defaultSettings.sessionTimeout = 28800000; // 8 hours
      client.defaultSettings.sessionRefreshTimeout = 5 * 60 * 1000; // 5 minutes
      client.defaultSettings.sessionChannel = undefined;
      client.defaultSettings.channelSettings = {};

      /** @type {Sequelize.Sequelize} */
      const { db } = client;

      SessionDb = db.define(
        'session',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          guildId: { type: Sequelize.STRING, notNull: true },
          userId: { type: Sequelize.STRING, notNull: true },
          avatar: { type: Sequelize.STRING, notNull: true },
          creator: { type: Sequelize.STRING, notNull: true },
          platform: {
            type: Sequelize.STRING,
            notNull: true,
            contains: ['Switch', 'PC', 'PS4', 'XB1', 'Unknown'],
          },
          description: Sequelize.STRING,
          sessionId: { type: Sequelize.STRING, unique: true, notNull: true },
          channelId: { type: Sequelize.STRING, notNull: true },
        },
        { createdAt: 'date' }
      );

      await SessionDb.sync();
      sessions = await SessionDb.findAll().map(async session => {
        const conf = {
          ...client.defaultSettings,
          ...(await client.settings.findByPk(session.guildId)).settings,
          guildId: session.guildId,
        };

        const { prefix, sessionTimeout, sessionRefreshTimeout } = conf;
        const channel = client.channels.get(session.channelId);

        client.log(`Restoring session: ${session.sessionId}`);
        const posted = session.date.getTime();
        const now = new Date().getTime();
        const remaining = posted - now + Number(sessionTimeout);

        Object.assign(session, {
          timer: setTimeout(
            () =>
              this.handleExpiredSession(
                client,
                channel,
                prefix,
                sessionTimeout,
                sessionRefreshTimeout,
                session
              ),
            remaining
          ),
        });
        return session;
      });

      const guilds = await client.settings.findAll();

      guilds.map(({ guildId, settings }) => {
        if (settings.sessionChannel && !sessionChannelTimers[guildId]) {
          const timer = setInterval(
            async () => this.updateSessionMessage(client, settings),
            5 * 60 * 1000
          );
          sessionChannelTimers[guildId] = timer;
          this.updateSessionMessage(client, settings);
        }

        return null;
      });
    };

    this.listSessions = async (conf, channel) => {
      const sessionMessage = this.buildSessionMessage(conf, channel);
      channel.send(sessionMessage, { split: true });
    };

    this.handleExpiredSession = async (
      client,
      channel,
      prefix,
      sessionTimeout,
      sessionRefreshTimeout,
      session
    ) => {
      const expireMessage = `Session ${session.sessionId} expired!`;

      this.removeSession(session.id);
      clearTimeout(session.timer);
      client.log(expireMessage);

      const sentMessage = await channel.send(
        `${expireMessage} React within 5 minutes ♻ to refresh this session!`
      );
      const reaction = await sentMessage.react('♻');
      const removeReactions = () => {
        sentMessage.edit(expireMessage);
        reaction.remove();
      };

      sentMessage
        .awaitReactions(
          (r, user) => r.emoji.name === '♻' && user.id !== client.user.id,
          { max: 1, time: sessionRefreshTimeout }
        )
        .then(collected => {
          const reactions = collected.first();

          if (sessions.some(s => s.sessionId === session.sessionId)) {
            removeReactions();
            return;
          }

          if (
            reactions.count === 0 ||
            (reactions.count === 1 && reactions.first().me)
          ) {
            removeReactions();
            return;
          }

          const refreshMessage = `Refreshed session ${session.sessionId}! ${prefix}`;
          channel.send(refreshMessage);

          SessionDb.create({
            guildId: session.guildId,
            userId: session.userId,
            avatar: session.avatar,
            creator: session.creator,
            channelId: channel.id,
            platform: session.platform,
            description: session.description,
            sessionId: session.sessionId,
          }).then(dbSes => {
            Object.assign(dbSes, {
              timer: setTimeout(
                () =>
                  this.handleExpiredSession(
                    client,
                    channel,
                    prefix,
                    sessionTimeout,
                    sessionRefreshTimeout,
                    dbSes
                  ),
                sessionTimeout
              ),
            });
            sessions.push(dbSes);
            client.log(refreshMessage);

            removeReactions();
          });
        })
        .catch(() => {
          removeReactions();
        });
    };

    this.createSessionMessage = async (client, conf, channel) => {
      const sessionChannelMessage = await channel.send(
        this.buildSessionMessage(conf, channel),
        { split: true }
      );
      await client.settings.update(
        {
          settings: {
            ...conf,
            sessionChannelMessage: sessionChannelMessage.id,
          },
        },
        { where: { guildId: channel.guild.id } }
      );

      return sessionChannelMessage;
    };
    /**
     *
     * @param {Discord.Client} client
     * @param {Object} conf
     */
    this.updateSessionMessage = async (client, conf) => {
      if (conf.sessionChannel) {
        /**
         * @type {Discord.TextChannel}
         */
        const channel = client.channels.find(
          c => c.id === conf.sessionChannel.replace(/<|#|>/g, '')
        );

        if (!channel) {
          client.log(
            `Unable to find channel ${conf.sessionChannel}, removing it.`
          );
          await this.removeSessionChannel(client, conf);
          return;
        }

        if (!conf.sessionChannelMessage) {
          client.log('SessionChannelMessage was not set, creating a new one.');
          await this.createSessionMessage(client, conf, channel);
        } else {
          try {
            const sessionChannelMessage = await channel.fetchMessage(
              conf.sessionChannelMessage
            );
            sessionChannelMessage.edit(
              this.buildSessionMessage(conf, channel).join('\n')
            );
          } catch (e) {
            client.log(
              `Unable to fetch sessionChannelMessage ${conf.sessionChannelMessage}, creating a new one.`
            );
            await this.createSessionMessage(client, conf, channel);
          }
        }
      }
    };

    /**
     *
     * @param {Discord.Client} client
     * @param {Discord.Message} message
     * @param {Object} conf
     * @param {string[]} params
     */
    this.run = async (client, message, conf, params) => {
      if (conf.sessionChannel && !sessionChannelTimers[message.guild.id]) {
        const timer = setInterval(
          async () => this.updateSessionMessage(client, conf),
          5 * 60 * 1000
        );
        sessionChannelTimers[message.guild.id] = timer;
      }

      if (!params.length) {
        this.listSessions(conf, message.channel);
        return;
      }

      const joinedParams = params.join(' ');
      const foundIceborne = iceborneRegex.exec(joinedParams);
      const foundPC = pcRegex.exec(joinedParams);
      const foundMHGU = mhguRegex.exec(joinedParams);

      const { prefix, sessionTimeout, sessionRefreshTimeout } = {
        ...client.defaultSettings,
        ...conf,
        guildId: message.guild.id,
      };

      const sessionId =
        (foundPC && foundPC[0]) ||
        (foundIceborne && foundIceborne[0]) ||
        (foundMHGU && foundMHGU[0]);

      if (params[0] === 'r' || params[0] === 'remove') {
        const session = sessions.find(ses => ses.sessionId === sessionId);

        if (!session || session.guildId !== message.guild.id) {
          message.channel.send('A session with that ID does not exist, nya...');
          return;
        }

        this.removeSession(session.id);
        clearTimeout(session.timer);
        message.channel.send(
          `Remeowved session ${session.sessionId}! ${prefix}`
        );
        await this.updateSessionMessage(client, conf);
        return;
      }

      if (!foundIceborne && !foundPC && !foundMHGU) {
        message.channel.send("Couldn't find any sessions, nya...");
        return;
      }

      const session = {
        userId: message.author.id,
        avatar: message.author.avatarURL,
        creator: message.author.username,
        date: moment(),
        guildId: message.guild.id,
      };

      if (foundPC || foundIceborne) {
        session.sessionId = sessionId;
        session.description = joinedParams
          .replace(session.sessionId, '')
          .trim();
        session.platform =
          dotProp.get(conf, `channelSettings.${message.channel.id}.platform`) ||
          (message.channel.name.toUpperCase().includes('PS4') && 'PS4') ||
          (message.channel.name.toUpperCase().includes('PC') && 'PC') ||
          (message.channel.name.toUpperCase().includes('XB1') && 'XB1') ||
          !!foundPC && 'PC' ||
          'Unknown';
      }

      if (foundMHGU) {
        session.sessionId = sessionId;
        session.description = foundMHGU.input.slice(
          foundMHGU[0].length + foundMHGU.index
        );
        session.platform = 'Switch';
      }

      if (
        sessions.some(
          s =>
            s.sessionId === session.sessionId && s.guildId === message.guild.id
        )
      ) {
        message.channel.send('A lobby with this ID already exists!');
        return;
      }

      if (!session.platform) {
        message.channel.send("Could not determine the session's platform..");
        session.platform = 'Unknown';
      }

      message.channel.send(
        `Added ${session.platform} session ${session.sessionId}! ${prefix}`
      );

      // see: http://www.asciitable.com/

      session.description = Discord.Util.escapeMarkdown(
        session.description
      ).slice(0, 180);
      const dbSes = await SessionDb.create({
        guildId: session.guildId,
        userId: session.userId,
        avatar: session.avatar,
        creator: session.creator,
        channelId: message.channel.id,
        platform: session.platform,
        description: session.description,
        sessionId: session.sessionId,
      });

      dbSes.timer = setTimeout(
        () =>
          this.handleExpiredSession(
            client,
            message.channel,
            prefix,
            sessionTimeout,
            sessionRefreshTimeout,
            dbSes
          ),
        sessionTimeout
      ); // auto clear after (default) 8 hours;

      sessions.push(dbSes);
      await this.updateSessionMessage(client, conf);
    };
  }
}
