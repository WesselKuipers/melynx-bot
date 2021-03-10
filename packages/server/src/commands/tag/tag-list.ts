import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../../types/melynxClient';

export default class TagList extends MelynxCommand {
  constructor() {
    super('tag-list', {
      description: 'List all existing tags for a guild',
      channel: 'guild',
      editable: false,
    });
  }

  public async exec(message: MelynxMessage): Promise<Message> {
    const tagDb = message.client.models.tag;
    const tags = await tagDb.findAll({ where: { guildId: message.guild.id } });

    if (!tags.length) {
      return message.util.send('This server currently has no tags.');
    }

    return message.util.send(`List of tags: \`${tags.map((tag) => tag.name).join('`, `')}\``);
  }
}
