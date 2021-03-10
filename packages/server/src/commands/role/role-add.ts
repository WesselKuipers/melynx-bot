import { Role } from 'discord.js';
import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../../types/melynxClient';

export default class TagAdd extends MelynxCommand {
  constructor() {
    super('role-add', {
      description: 'Add a self-assignable role',
      clientPermissions: ['MANAGE_ROLES'],
      userPermissions: ['MANAGE_ROLES'],
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
    if (!role.editable) {
      return message.util.send("I'm not allowed to assign this role.");
    }

    const roleDb = message.client.models.role;
    const [, created] = await roleDb.findCreateFind({
      where: { id: role.id, name: role.name, guildId: message.guild.id },
    });

    if (!created) {
      return message.util.send(`Role ${role.name} already exists`);
    } else {
      return message.util.send(`Added role ${role.name}`);
    }
  }
}
