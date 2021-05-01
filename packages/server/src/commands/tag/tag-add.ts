import { Message } from 'discord.js';
import { getGuildSettings } from '../../bot/utils';
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
      async userPermissions(message: MelynxMessage): Promise<string | void> {
        const permissions = await getGuildSettings(message.client, message.guild.id);
        if (
          message.client.isOwner(message.author) ||
          message.member.hasPermission('MANAGE_MESSAGES') ||
          message.member.roles.cache.some(
            (role) =>
              role.id === permissions.adminRole ||
              role.name === permissions.adminRole ||
              role.id === permissions.modRole ||
              role.name === permissions.modRole
          )
        ) {
          return null;
        }

        return 'Moderator privileges';
      },
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
