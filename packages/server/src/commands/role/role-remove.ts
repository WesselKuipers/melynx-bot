import { Role } from 'discord.js';
import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../../types/melynxClient';

export default class TagRemove extends MelynxCommand {
  constructor() {
    super('role-remove', {
      description: 'Remove a self-assignable role',
      args: [
        {
          id: 'role',
          type: 'role',
          prompt: {
            start: 'Which role should be added? Type `cancel` to stop.',
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

  public async exec(message: MelynxMessage, { role }: { role: Role }): Promise<Message> {
    const roleDb = message.client.models.role;
    const result = await roleDb.destroy({ where: { id: role.id } });

    if (result) {
      return message.util.send('Remeowved role.');
    }

    return message.util.send('This role was already not self-assignyable.');
  }
}
