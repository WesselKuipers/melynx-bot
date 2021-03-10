import { Message } from 'discord.js';
import { buildSessionMessage } from '../../bot/utils';
import { MelynxCommand, MelynxMessage } from '../../types/melynxClient';

export default class SessionList extends MelynxCommand {
  constructor() {
    super('session-list', {
      description: 'List all sessions',
      channel: 'guild',
      editable: true,
    });
  }

  public async exec(message: MelynxMessage): Promise<Message> {
    const sessionDb = message.client.models.session;
    const sessions = await sessionDb.findAll({ where: { guildId: message.guild.id } });

    return message.util.send(buildSessionMessage(message.guild.id, sessions));
  }
}
