import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../types/melynxClient';

export default class Ping extends MelynxCommand {
  constructor() {
    super('ping', {
      aliases: ['p', 'ping'],
      description: 'Pings the bot, will respond with `Pong! ([latency] ms)`',
    });

    this.usage = '{prefix}ping';
  }

  public async exec(message: MelynxMessage): Promise<Message> {
    return message.util.send(
      `Pong! (${Math.abs(new Date().getTime() - message.createdTimestamp)} ms)`
    );
  }
}
