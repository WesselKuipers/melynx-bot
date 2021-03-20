import { Message } from 'discord.js';
import { getGuildSettings } from '../bot/utils';
import { MelynxCommand, MelynxMessage } from '../types/melynxClient';

export default class GetConf extends MelynxCommand {
  constructor() {
    super('getconf', {
      aliases: ['getconf'],
      description: 'Get the config for this server.',
      channel: 'guild',
      editable: false,
      async userPermissions(message: MelynxMessage): Promise<string | void> {
        const permissions = await getGuildSettings(message.client, message.guild.id);
        if (
          message.client.isOwner(message.author) ||
          message.member.hasPermission('ADMINISTRATOR') ||
          message.member.roles.cache.some(
            (role) => role.id === permissions.adminRole || role.name === permissions.adminRole
          )
        ) {
          return null;
        }

        return 'Administrator privileges';
      },
    });

    this.usage = '{prefix}getconf';
  }

  public async exec(message: MelynxMessage): Promise<Message> {
    const config = await getGuildSettings(message.client, message.guild.id);
    return message.util.send(`\`\`\`${JSON.stringify(config, null, 2)}\`\`\``);
  }
}
