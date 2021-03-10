import dedent from 'dedent';
import { Argument, Flag } from 'discord-akairo';
import { TextChannel } from 'discord.js';
import { Message, Util } from 'discord.js';
import dotProp from 'dot-prop';
import { ModelCtor } from 'sequelize/types';
import { getGuildSettings } from '../../bot/utils';
import { MelynxCommand, MelynxMessage, Session } from '../../types/melynxClient';

const iceborneRegex = /[a-zA-Z0-9#]{4} [a-zA-Z0-9]{4} [a-zA-Z0-9]{4}/;
const pcRegex = /[a-zA-Z0-9#+?@$#&!=-]{12}/;
const mhguRegex = /\b\d{2}-\d{4}-\d{4}-\d{4}\b/;

export default class SessionComand extends MelynxCommand {
  sessionDb: ModelCtor<Session>;

  constructor() {
    super('session', {
      channel: 'guild',
      aliases: ['session', 's'],
      description:
        'Lists all current sessions or adds one. By default sessions expire automatically after 8 hours.',
    });

    this.usage = `\n${dedent(`
    {prefix} session (Lists current sessions)
    {prefix} session [session id] [description] (Adds a new session)
    {prefix} session remove [session id] (Removes an existing session)`)}`;
  }

  *args() {
    const name = yield {
      type: Argument.union(
        [
          ['session-remove', 'remove', 'r'],
          ['session-list', 'list', 'l'],
        ],
        'string'
      ),
    };

    if (!name || name === 'session-list') {
      // Continue with list command
      return Flag.continue('session-list');
    }

    const rest = yield {
      type: 'string',
      match: 'rest',
    };

    // Run exec()
    return rest ? { args: `${name} ${rest}` } : { args: name };
  }

  public async exec(message: MelynxMessage, { args }: { args: string }): Promise<Message> {
    const id = args.startsWith('session-remove') ? args.replace('session-remove ', '') : args;
    const foundIceborne = iceborneRegex.exec(id);
    const foundPC = pcRegex.exec(id);
    const foundMHGU = mhguRegex.exec(id);

    if (!foundMHGU && !foundPC && !foundIceborne) {
      return message.util.send('Could not find any sessions, nya...');
    }

    const config = await getGuildSettings(message.client, message.guild.id);
    const sessionId = foundMHGU?.[0] ?? foundPC?.[0] ?? foundIceborne[0];

    if (args.startsWith('session-remove')) {
      const session = this.client.sessionManager.sessions.find((s) => s.sessionId === sessionId);
      if (!session) {
        return message.util.send('A session with that ID does not exist, nya...');
      }

      await this.client.sessionManager.removeSession(session);
      await this.client.sessionManager.updateSessionMessage(message.client, message.guild.id);
      return message.channel.send(`Remeowved session ${session.sessionId}!`);
    }

    const session: Partial<Session> = {
      userId: message.author.id,
      avatar: message.author.avatarURL(),
      creator: message.author.username,
      date: new Date(),
      guildId: message.guild.id,
      channelId: message.channel.id,
    };

    if (foundMHGU) {
      session.sessionId = sessionId;
      session.description = foundMHGU.input.slice(foundMHGU[0].length + foundMHGU.index);
      session.platform = 'Switch';
    } else {
      session.sessionId = sessionId;
      session.description = id.replace(sessionId, '').trim();
      session.platform =
        dotProp.get(config, `channelSettings.${message.channel.id}.platform`) ||
        ((message.channel as TextChannel).name.toUpperCase().includes('PS4') && 'PS4') ||
        ((message.channel as TextChannel).name.toUpperCase().includes('PC') && 'PC') ||
        ((message.channel as TextChannel).name.toUpperCase().includes('XB1') && 'XB1') ||
        (!!foundPC && 'PC') ||
        'Unknown';
    }

    if (
      this.client.sessionManager.sessions.some(
        (s) => s.sessionId === session.sessionId && s.guildId === message.guild.id
      )
    ) {
      return message.util.send('A lobby with this ID already exists!');
    }

    if (session.description) {
      // see: http://www.asciitable.com/
      session.description = Util.escapeMarkdown(session.description).slice(0, 180);
    }

    await this.client.sessionManager.addSession(session as Session);
    await this.client.sessionManager.updateSessionMessage(message.client, message.guild.id);
    return message.util.send(`Added ${session.platform} session ${session.sessionId}!`);
  }
}
