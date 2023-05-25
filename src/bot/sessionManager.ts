import { TextChannel } from 'discord.js';

import { GuildConfig, MelynxClient, Session, Settings } from './types';
import { buildSessionMessage, getGuildSettings, updateGuildSettings } from './utils';
import { prisma } from '../server/db/client';

export default class SessionManager {
  client!: MelynxClient;
  sessions: Session[] = [];

  sessionChannelTimers: { [guildId: string]: NodeJS.Timeout } = {};

  async init(client: MelynxClient) {
    this.client = client;

    const dbSessions = await prisma.session.findMany();
    this.sessions = await Promise.all(
      dbSessions.map(async (session) => {
        const { sessionTimeout } = await getGuildSettings(this.client, session.guildId);
        client.log(`Restoring session: ${session.sessionId}`);
        const posted = session.createdAt.getTime();
        const now = new Date().getTime();
        const remaining = posted - now + Number(sessionTimeout);

        Object.assign(session, {
          timer: setTimeout(() => this.handleExpiredSession(session), remaining),
        });

        return session;
      })
    );

    const guilds = await prisma.settings.findMany();
    guilds.map(({ guildId, settings }) => {
      const castedSettings = settings as unknown as GuildConfig; // JSON fields in Prisma doesn’t allow for typing its JSON fields.
      if (castedSettings.sessionChannel && !this.sessionChannelTimers[guildId]) {
        const timer = setInterval(
          async () => this.updateSessionMessage(client, guildId),
          5 * 60 * 1000
        );
        this.sessionChannelTimers[guildId] = timer;
        this.updateSessionMessage(client, guildId);
        this.client.log(`Initialized session message timer for guild ${guildId}`);
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
    await sentMessage.react('♻');
    const removeReactions = async () => {
      await sentMessage.edit(expireMessage);
      try {
        await sentMessage.reactions.cache.get('♻')?.users.remove();
      } catch {
        this.client.log(`Unable to remove reactions.`);
      }
    };

    try {
      const collected = await sentMessage.awaitReactions({
        filter: (reaction, user) => reaction.emoji.name === '♻' && user.id !== this.client.user?.id,
        max: 1,
        time: config.sessionRefreshTimeout,
      });

      const reactions = collected.first();

      if (this.sessions.some((s) => s.sessionId === session.sessionId)) {
        await removeReactions();
        return;
      }

      if (!reactions?.count) {
        await removeReactions();
        return;
      }

      const refreshMessage = `Refreshed session \`${session.sessionId}\`!`;
      await channel.send(refreshMessage);

      const dbSes = await prisma.session.create({
        data: {
          guildId: session.guildId,
          userId: session.userId,
          avatar: session.avatar,
          creator: session.creator,
          channelId: channel.id,
          platform: session.platform,
          description: session.description,
          sessionId: session.sessionId,
        },
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
    this.updateSessionMessage(this.client, session.guildId);
  }

  public async removeSession(session: Session): Promise<void> {
    await prisma.session.delete({ where: { id: session.id } });
    this.sessions = this.sessions.filter((item) => item.id !== session.id);
    clearTimeout(session.timer);
    this.updateSessionMessage(this.client, session.guildId);
  }

  public async updateSession(
    session: Pick<Session, 'id' | 'sessionId' | 'description'>
  ): Promise<void> {
    const cached = this.sessions.find((s) => s.id === session.id);
    if (!cached) {
      return;
    }

    if (session.description) {
      cached.description = session.description;
    }

    if (session.sessionId) {
      cached.sessionId = session.sessionId;
    }

    await prisma.session.update({
      where: { id: cached.id },
      data: {
        description: cached.description,
        sessionId: cached.sessionId,
      },
    });

    this.updateSessionMessage(this.client, cached.guildId);
  }

  public async addSession(session: Session): Promise<void> {
    const config = await getGuildSettings(this.client, session.guildId);
    const dbSes = await prisma.session.create({
      data: {
        guildId: session.guildId,
        userId: session.userId,
        avatar: session.avatar,
        creator: session.creator,
        channelId: session.channelId,
        platform: session.platform,
        description: session.description,
        sessionId: session.sessionId,
      },
    });

    // auto clear after (default) 8 hours;
    (dbSes as Session).timer = setTimeout(
      () => this.handleExpiredSession(dbSes),
      config.sessionTimeout
    );
    this.sessions.push(dbSes);
    this.updateSessionMessage(this.client, session.guildId);
  }

  async updateSessionMessage(client: MelynxClient, guildId: string) {
    const config = await getGuildSettings(client, guildId);

    if (config.sessionChannel) {
      const channelId = config.sessionChannel.replace(/<|#|>/g, '');
      let channel: TextChannel | undefined = undefined;

      try {
        channel = (await client.channels.fetch(channelId)) as TextChannel;
      } catch (e) {
        client.log(`Error when fetching channel`);
      }

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
          client.error(e as Error);
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
    await updateGuildSettings(client, channel.guild.id, {
      ...config,
      sessionChannelMessage: sessionChannelMessage.id,
    });

    return sessionChannelMessage;
  }

  async removeSessionChannel(client: MelynxClient, guildId: string) {
    const config = await getGuildSettings(client, guildId);

    client.log(`Removing session channel on guild: ${config.guildId}`);
    await updateGuildSettings(client, guildId, {
      ...config,
      sessionChannel: '',
      sessionChannelMessage: '',
    });
  }
}
