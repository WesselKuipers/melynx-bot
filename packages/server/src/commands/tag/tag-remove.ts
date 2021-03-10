import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../../types/melynxClient';

export default class TagRemove extends MelynxCommand {
  constructor() {
    super('tag-remove', {
      description: 'Remove an existing tag',
      args: [
        {
          id: 'name',
          type: 'string',
          prompt: {
            start: 'What is the name of the tag? Type `cancel` to stop.',
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

  public async exec(message: MelynxMessage, { name }: { name: string }): Promise<Message> {
    const tagDb = message.client.models.tag;
    const tag = await tagDb.findOne({ where: { guildId: message.guild.id, name } });

    if (!tag) {
      return message.util.send(`Tag \`${name}\` doesn't exist!`);
    } else {
      await tag.destroy();
      return message.util.send(`Deleted tag \`${name}\`.`);
    }
  }
}
