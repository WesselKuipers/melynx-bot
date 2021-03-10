import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../../types/melynxClient';

export default class TagList extends MelynxCommand {
  constructor() {
    super('role-list', {
      description: 'List all self-assignable roles for a guild',
      channel: 'guild',
      editable: false,
    });
  }

  public async exec(message: MelynxMessage): Promise<Message> {
    const roleDb = message.client.models.role;
    const roles = await roleDb.findAll({ where: { guildId: message.guild.id } });

    if (!roles.length) {
      return message.util.send('This server currently has no self-assignable roles.');
    }

    return message.util.send(
      `List of joinable roles: \`\`\`${message.guild.roles.cache
        .filter((r) => roles.map((ro) => ro.id).includes(r.id))
        .map((r) => r.name)
        .join(', ')}\`\`\``
    );
  }
}
