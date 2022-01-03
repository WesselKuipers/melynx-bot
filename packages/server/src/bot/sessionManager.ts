import { TextChannel } from 'discord.js';
import { MelynxClient, Session, Models } from '../types';
import { buildSessionMessage, getGuildSettings } from './utils';

export default class SessionManager {
  client: MelynxClient;
  sessions: Session[] = [];
  sessionDb: Models['session'];
  sessionChannelTimers: { [guildId: string]: NodeJS.Timeout } = {};

  async init(client: MelynxClient) {
    this.sessionDb = client.models.session;
    this.client = client;

    const dbSessions = await this.sessionDb.findAll();
    this.sessions = await Promise.all(
      dbSessions.map(async (session) => {
        const { sessionTimeout } = await getGuildSettings(this.client, session.guildId);
        client.log(`Restoring session: ${session.sessionId}`);
        const posted = session.date.getTime();
        const now = new Date().getTime();
        const remaining = posted - now + Number(sessionTimeout);

        Object.assign(session, {
          timer: setTimeout(() => this.handleExpiredSession(session), remaining),
        });

        return session;
      })
    );

    const guilds = await client.settings.model.findAll();
    guilds.map(({ guildId, settings }) => {
      if (settings.sessionChannel && !this.sessionChannelTimers[guildId]) {
        const timer = setInterval(
          async () => this.updateSessionMessage(client, guildId),
          5 * 60 * 1000
        );
        this.sessionChannelTimers[guildId] = timer;
        this.updateSessionMessage(client, guildId);
      }

      return null;
    });
  }

  public async handleExpiredSession(session: Session) {
    const expireMessage = `Session ${session.sessionId} expired!`;

    this.removeSession(session);
    this.client.log(expireMessage);

    const channel = (await this.client.channels.fetch(session.channelId)) as TextChannel;
    const config = await getGuildSettings(this.client, channel.guild.id);

    const sentMessage = await channel.send(
      `${expireMessage} React within 5 minutes ♻ to refresh this session!`
    );
    const reaction = await sentMessage.react('♻');
    const removeReactions = async () => {
      await sentMessage.edit(expireMessage);
      await reaction.remove();
    };

    try {
      const collected = await sentMessage.awaitReactions({
        filter: (reaction, user) => reaction.emoji.name === '♻' && user.id !== this.client.user.id,
        max: 1,
        time: config.sessionRefreshTimeout,
      });

      const reactions = collected.first();

      if (this.sessions.some((s) => s.sessionId === session.sessionId)) {
        await removeReactions();
        return;
      }

      if (reactions.count === 0 || (reactions.count === 1 && reactions.me)) {
        await removeReactions();
        return;
      }

      const refreshMessage = `Refreshed session ${session.sessionId}!`;
      await channel.send(refreshMessage);

      const dbSes = await this.sessionDb.create({
        guildId: session.guildId,
        userId: session.userId,
        avatar: session.avatar,
        creator: session.creator,
        channelId: channel.id,
        platform: session.platform,
        description: session.description,
        sessionId: session.sessionId,
      });

      Object.assign(dbSes, {
        timer: setTimeout(() => this.handleExpiredSession(dbSes), config.sessionTimeout),
      });
      this.sessions.push(dbSes);
      this.client.log(refreshMessage);

      await removeReactions();
    } catch {
      await removeReactions();
    }
  }

  public async removeSession(session: Session): Promise<void> {
    await this.sessionDb.destroy({ where: { id: session.id } });
    this.sessions = this.sessions.filter((item) => item.id !== session.id);
    clearTimeout(session.timer);
  }

  public async addSession(session: Session): Promise<void> {
    const config = await getGuildSettings(this.client, session.guildId);
    const dbSes = await this.sessionDb.create({
      guildId: session.guildId,
      userId: session.userId,
      avatar: session.avatar,
      creator: session.creator,
      channelId: session.channelId,
      platform: session.platform,
      description: session.description,
      sessionId: session.sessionId,
    });

    // auto clear after (default) 8 hours;
    dbSes.timer = setTimeout(() => this.handleExpiredSession(dbSes), config.sessionTimeout);
    this.sessions.push(dbSes);
  }

  async updateSessionMessage(client: MelynxClient, guildId: string) {
    const config = await getGuildSettings(client, guildId);

    if (config.sessionChannel) {
      const channelId = config.sessionChannel.replace(/<|#|>/g, '');
      const channel = (await client.channels.fetch(channelId)) as TextChannel;

      if (!channel) {
        client.log(`Unable to find channel ${config.sessionChannel}, removing it.`);
        await this.removeSessionChannel(client, guildId);
        return;
      }

      if (!config.sessionChannelMessage) {
        client.log('SessionChannelMessage was not set, creating a new one.');
        await this.createSessionMessage(client, channel);
      } else {
        try {
          const sessionChannelMessage = await channel.messages.fetch(config.sessionChannelMessage);
          await sessionChannelMessage.edit(buildSessionMessage(guildId, this.sessions));
        } catch (e) {
          client.error(e);
          client.log(
            `Unable to fetch sessionChannelMessage ${config.sessionChannelMessage}, creating a new one.`
          );
          await this.createSessionMessage(client, channel);
        }
      }
    }
  }

  async createSessionMessage(client: MelynxClient, channel: TextChannel) {
    const config = await getGuildSettings(client, channel.guild.id);
    const sessionChannelMessage = await channel.send(
      buildSessionMessage(channel.guild.id, this.sessions)
    );
    client.log(`Created ${sessionChannelMessage.id}`);
    await client.settings.model.update(
      {
        settings: {
          ...config,
          sessionChannelMessage: sessionChannelMessage.id,
        },
      },
      { where: { guildId: channel.guild.id } }
    );
    client.settings.cache[config.guildId].sessionChannelMessage = sessionChannelMessage.id;

    return sessionChannelMessage;
  }

  async removeSessionChannel(client: MelynxClient, guildId: string) {
    const config = await getGuildSettings(client, guildId);

    client.log(`Removing session channel on guild: ${config.guildId}`);
    await client.settings.model.update(
      {
        settings: {
          ...config,
          sessionChannel: '',
          sessionChannelMessage: null,
        },
      },
      { where: { guildId: config.guildId } }
    );

    // Update the cache too
    client.settings.cache[config.guildId].sessionChannel = '';
    client.settings.cache[config.guildId].sessionChannelMessage = null;
  }
}
