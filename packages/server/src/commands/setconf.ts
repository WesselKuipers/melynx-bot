import { Message } from 'discord.js';
import dotProp from 'dot-prop';
import { getGuildSettings } from '../bot/utils';
import { MelynxCommand, MelynxMessage } from '../types/melynxClient';

export default class SetConf extends MelynxCommand {
  constructor() {
    super('setconf', {
      aliases: ['setconf'],
      args: [
        { id: 'prop', type: 'string' },
        { id: 'values', match: 'separate', type: 'string' },
      ],
      description: 'Sets server-specific config settings.',
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

    this.usage = '{prefix}setconf [prop] [value]';
  }

  public async exec(
    message: MelynxMessage,
    { prop, values }: { prop: string; values: string[] }
  ): Promise<Message> {
    const config = await getGuildSettings(message.client, message.guild.id);

    // replaces any mentions with regular IDs
    const cleanedProp = prop.replace(/<[@|#|&](\d+)>/, '$1');
    const settings = dotProp.set(config, cleanedProp, values.join(' '));
    const [update] = await message.client.settings.model.update(
      {
        settings,
      },
      { where: { guildId: message.guild.id } }
    );

    if (update > 0) {
      // Update the cached settings
      message.client.settings.cache[message.guild.id] = settings;

      return message.util.send(
        `Guild configuration item ${cleanedProp} has been changed to:\n\`${values.join(' ')}\``
      );
    }
  }
}
