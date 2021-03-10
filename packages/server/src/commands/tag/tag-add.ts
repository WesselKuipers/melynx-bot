import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../../types/melynxClient';

export default class TagAdd extends MelynxCommand {
  constructor() {
    super('tag-add', {
      description: 'Add or update a custom tag',
      args: [
        {
          id: 'name',
          type: 'string',
          prompt: {
            start: 'What should be the name of this tag? Type `cancel` to stop.',
            timeout: 'Time ran out, command has been cancelled.',
            ended: 'Too many retries, command has been cancelled.',
            cancel: 'Command has been cancelled.',
            retries: 4,
            time: 30e3,
          },
        },
        {
          id: 'content',
          match: 'rest',
          type: 'string',
          prompt: {
            start: 'What should be the content of this tag? Type `cancel` to stop.',
            timeout: 'Time ran out, command has been cancelled.',
            ended: 'Too many retries, command has been cancelled.',
            cancel: 'Command has been cancelled.',
            retries: 4,
            time: 30e3,
          },
        },
      ],
      channel: 'guild',
      editable: false,
    });
  }

  public async exec(
    message: MelynxMessage,
    { name, content }: { name: string; content: string }
  ): Promise<Message> {
    const tagDb = message.client.models.tag;
    const tag = await tagDb.findOne({ where: { guildId: message.guild.id, name } });

    if (!tag) {
      await tagDb.create({ guildId: message.guild.id, name, content });
      return message.util.send(`Created tag \`${name}\`.`);
    } else {
      await tag.update({ content });
      await message.util.send(`Updated tag \`${name}\`.`);
    }
  }
}
