import Discord, { TextChannel } from 'discord.js';
import dotProp from 'dot-prop';
import moment from 'moment';
import Sequelize, { Model, ModelCtor } from 'sequelize';
import Command, { GuildConfig, PermissionLevel } from '../types/command';
import { MelynxClient } from '../types/melynxClient';

const iceborneRegex = /[a-zA-Z0-9#]{4} [a-zA-Z0-9]{4} [a-zA-Z0-9]{4}/;
const pcRegex = /[a-zA-Z0-9#+?@$#&!=-]{12}/;
const mhguRegex = /\b\d{2}-\d{4}-\d{4}-\d{4}\b/;

let sessions: Session[] = [];

interface Session extends Model {
  id: number;
  guildId: string;
  userId: string;
  avatar: string;
  creator: string;
  platform: 'Switch' | 'PC' | 'PS4' | 'XB1' | 'Unknown';
  description: string;
  sessionId: string;
  channelId: string;
  date: Date;
  timer?: NodeJS.Timeout;
}

let SessionDb: ModelCtor<Session>;

const sessionChannelTimers: { [guildId: string]: NodeJS.Timeout } = {};

async function removeSessionChannel(client: MelynxClient, conf: GuildConfig) {
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
}

async function buildSessionMessage(conf: GuildConfig, channel: TextChannel): Promise<string[]> {
  const { prefix } = conf;
  const sessionMessage = [];

  sessions
    .filter((s) => s.guildId === channel.guild.id)
    .map((s) => {
      sessionMessage.push(
        `(${Math.floor(moment.duration(moment().diff(s.date)).asMinutes())}m ago by ${
          s.creator
        }) [${s.platform}]: ${s.sessionId} ${s.description}`
      );
      return null;
    });

  if (!sessionMessage.length) {
    sessionMessage.push(
      `There are no active sessions! Feel free to create one yourself! ${prefix}`
    );
  }

  return sessionMessage;
}

async function removeSession(id: number) {
  sessions = sessions.filter((item) => item.id !== id);
  await SessionDb.destroy({ where: { id } }).then(() => {});
}

async function handleExpiredSession(
  client: MelynxClient,
  channel: TextChannel,
  prefix: string,
  sessionTimeout: number,
  sessionRefreshTimeout: number,
  session: Session
) {
  const expireMessage = `Session ${session.sessionId} expired!`;

  removeSession(session.id);
  clearTimeout(session.timer);
  client.log(expireMessage);

  const sentMessage = await channel.send(
    `${expireMessage} React within 5 minutes ♻ to refresh this session!`
  );
  const reaction = await sentMessage.react('♻');
  const removeReactions = () => {
    sentMessage.edit(expireMessage);
    sentMessage.reactions.removeAll().catch(() => {
      reaction.users.cache.delete(client.user.id);
    });
  };

  sentMessage
    .awaitReactions((r, user) => r.emoji.name === '♻' && user.id !== client.user.id, {
      max: 1,
      time: sessionRefreshTimeout,
    })
    .then((collected) => {
      const reactions = collected.first();

      if (sessions.some((s) => s.sessionId === session.sessionId)) {
        removeReactions();
        return;
      }

      if (reactions.count === 0 || (reactions.count === 1 && reactions.me)) {
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
      }).then((dbSes) => {
        Object.assign(dbSes, {
          timer: setTimeout(
            () =>
              handleExpiredSession(
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
}

async function createSessionMessage(client: MelynxClient, conf: GuildConfig, channel: TextChannel) {
  const sessionChannelMessage = await channel.send(buildSessionMessage(conf, channel));
  client.log(`Created ${sessionChannelMessage.id}`);
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
}

async function listSessions(conf: GuildConfig, channel: TextChannel) {
  const sessionMessage = buildSessionMessage(conf, channel);
  await channel.send(sessionMessage, { split: true });
}

async function updateSessionMessage(client: MelynxClient, guildId: string) {
  const conf = {
    ...client.defaultSettings,
    ...(await client.settings.findByPk(guildId)).settings,
  };

  if (conf.sessionChannel) {
    const channel = client.channels.cache.find(
      (c) => c.id === conf.sessionChannel.replace(/<|#|>/g, '')
    ) as TextChannel;

    if (!channel) {
      client.log(`Unable to find channel ${conf.sessionChannel}, removing it.`);
      await removeSessionChannel(client, conf);
      return;
    }

    if (!conf.sessionChannelMessage) {
      client.log('SessionChannelMessage was not set, creating a new one.');
      await createSessionMessage(client, conf, channel);
    } else {
      try {
        const sessionChannelMessage = await channel.messages.fetch(conf.sessionChannelMessage);
        await sessionChannelMessage.edit((await buildSessionMessage(conf, channel)).join('\n'));
      } catch (e) {
        client.error(e);
        client.log(
          `Unable to fetch sessionChannelMessage ${conf.sessionChannelMessage}, creating a new one.`
        );
        await createSessionMessage(client, conf, channel);
      }
    }
  }
}

export default {
  config: {
    enabled: true,
    aliases: ['ses', 's', 'sessions'],
    permissionLevel: PermissionLevel.Anyone,
    guildOnly: true,
    ownerOnly: false,
  },

  help: {
    name: 'session',
    description:
      'Lists all current sessions or adds one. Sessions expire automatically after 8 hours.',
    usage:
      '\n{prefix} session (lists current sessions)\n{prefix} session [session id] [description] (Adds a new session)\n{prefix} session [remove|r] [session id] (Removes a session)',
  },

  init: async (client: MelynxClient) => {
    const { db } = client;

    SessionDb = db.define(
      'session',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        guildId: { type: Sequelize.STRING, allowNull: false },
        userId: { type: Sequelize.STRING, allowNull: false },
        avatar: { type: Sequelize.STRING, allowNull: false },
        creator: { type: Sequelize.STRING, allowNull: false },
        platform: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        description: Sequelize.STRING,
        sessionId: { type: Sequelize.STRING, unique: true, allowNull: false },
        channelId: { type: Sequelize.STRING, allowNull: false },
      },
      { createdAt: 'date' }
    );

    await SessionDb.sync();
    const dbSessions = await SessionDb.findAll();
    sessions = await Promise.all(
      dbSessions.map(async (session) => {
        const conf = {
          ...client.defaultSettings,
          ...(await client.settings.findByPk(session.guildId)).settings,
          guildId: session.guildId,
        };

        const { prefix, sessionTimeout, sessionRefreshTimeout } = conf;
        const channel = client.channels.cache.get(session.channelId) as TextChannel;

        client.log(`Restoring session: ${session.sessionId}`);
        const posted = session.date.getTime();
        const now = new Date().getTime();
        const remaining = posted - now + Number(sessionTimeout);

        Object.assign(session, {
          timer: setTimeout(
            () =>
              handleExpiredSession(
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
      })
    );

    const guilds = await client.settings.findAll();

    guilds.map(({ guildId, settings }) => {
      if (settings.sessionChannel && !sessionChannelTimers[guildId]) {
        const timer = setInterval(async () => updateSessionMessage(client, guildId), 5 * 60 * 1000);
        sessionChannelTimers[guildId] = timer;
        updateSessionMessage(client, guildId);
      }

      return null;
    });
  },

  run: async (client, message, conf, params) => {
    if (conf.sessionChannel && !sessionChannelTimers[message.guild.id]) {
      const timer = setInterval(
        async () => updateSessionMessage(client, message.guild.id),
        5 * 60 * 1000
      );
      sessionChannelTimers[message.guild.id] = timer;
    }

    if (!params.length) {
      listSessions(conf, message.channel as TextChannel);
      return;
    }

    const joinedParams = params.join(' ');
    const foundIceborne = iceborneRegex.exec(joinedParams);
    const foundPC = pcRegex.exec(joinedParams);
    const foundMHGU = mhguRegex.exec(joinedParams);

    const { prefix, sessionTimeout, sessionRefreshTimeout }: GuildConfig = {
      ...client.defaultSettings,
      ...conf,
      guildId: message.guild.id,
    };

    const sessionId =
      (foundPC && foundPC[0]) || (foundIceborne && foundIceborne[0]) || (foundMHGU && foundMHGU[0]);

    if (params[0] === 'r' || params[0] === 'remove') {
      const session = sessions.find((ses) => ses.sessionId === sessionId);

      if (!session || session.guildId !== message.guild.id) {
        message.channel.send('A session with that ID does not exist, nya...');
        return;
      }

      removeSession(session.id);
      clearTimeout(session.timer);
      message.channel.send(`Remeowved session ${session.sessionId}! ${prefix}`);
      await updateSessionMessage(client, message.guild.id);
      return;
    }

    if (!foundIceborne && !foundPC && !foundMHGU) {
      message.channel.send("Couldn't find any sessions, nya...");
      return;
    }

    const session: Partial<Session> = {
      userId: message.author.id,
      avatar: message.author.avatarURL(),
      creator: message.author.username,
      date: new Date(),
      guildId: message.guild.id,
    };

    if (foundPC || foundIceborne) {
      session.sessionId = sessionId;
      session.description = joinedParams.replace(session.sessionId, '').trim();
      session.platform =
        dotProp.get(conf, `channelSettings.${message.channel.id}.platform`) ||
        ((message.channel as TextChannel).name.toUpperCase().includes('PS4') && 'PS4') ||
        ((message.channel as TextChannel).name.toUpperCase().includes('PC') && 'PC') ||
        ((message.channel as TextChannel).name.toUpperCase().includes('XB1') && 'XB1') ||
        (!!foundPC && 'PC') ||
        'Unknown';
    }

    if (foundMHGU) {
      session.sessionId = sessionId;
      session.description = foundMHGU.input.slice(foundMHGU[0].length + foundMHGU.index);
      session.platform = 'Switch';
    }

    if (sessions.some((s) => s.sessionId === session.sessionId && s.guildId === message.guild.id)) {
      message.channel.send('A lobby with this ID already exists!');
      return;
    }

    if (!session.platform) {
      message.channel.send("Could not determine the session's platform..");
      session.platform = 'Unknown';
    }

    message.channel.send(`Added ${session.platform} session ${session.sessionId}! ${prefix}`);

    // see: http://www.asciitable.com/

    session.description = Discord.Util.escapeMarkdown(session.description).slice(0, 180);
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
        handleExpiredSession(
          client,
          message.channel as TextChannel,
          prefix,
          sessionTimeout,
          sessionRefreshTimeout,
          dbSes
        ),
      sessionTimeout
    ); // auto clear after (default) 8 hours;

    sessions.push(dbSes);
    await updateSessionMessage(client, session.guildId);
  },
} as Command;
