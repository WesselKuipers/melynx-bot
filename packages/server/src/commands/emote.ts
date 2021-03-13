import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../types/melynxClient';
import { MessageAttachment } from 'discord.js';

const emojiRegex = /<(a)?:\w+:\d+>/;

export default class Emote extends MelynxCommand {
  constructor() {
    super('emote', {
      aliases: ['emote', 'emoji', 'hugemoji', 'hugemote', 'bigemote', 'bigemoji'],
      description:
        'Display a bigger version of an emote. Currently does not support default emojis.',
      args: [{ id: 'emoji', type: 'string' }],
    });

    this.usage = '{prefix}emote {emoji}';
  }

  public async exec(message: MelynxMessage, { emoji }: { emoji: string }): Promise<Message> {
    if (!emoji.match(emojiRegex)) {
      return null;
    }

    const id = emoji.split(':').pop().slice(0, -1);
    const animated = emoji.startsWith('<a:');

    return message.util.send(
      new MessageAttachment(
        `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?v=1`
      )
    );
  }
}
