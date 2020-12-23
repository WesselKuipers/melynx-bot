import dotProp from 'dot-prop';
import Command, { PermissionLevel } from '../types/command';

export default {
  config: {
    enabled: true,
    permissionLevel: PermissionLevel.Admin,
    aliases: [],
    guildOnly: true,
    ownerOnly: false,
  },

  help: {
    name: 'setconf',
    description: 'Sets server-specific config settings',
    usage: '{prefix} setconf [prop] [value]',
  },

  run: async (client, message, conf, params) => {
    const [prop, ...value] = params;
    const config = { ...client.defaultSettings, ...conf };

    // replaces any mentions with regular IDs
    const cleanedProp = prop.replace(/<[@|#|&](\d+)>/, '$1');

    const [update] = await client.settings.update(
      {
        settings: {
          ...dotProp.set(config, cleanedProp, value.join(' ')),
        },
      },
      { where: { guildId: message.guild.id } }
    );

    if (update > 0) {
      message.channel.send(
        `Guild configuration item ${cleanedProp} has been changed to:\n\`${value.join(' ')}\``
      );
    }
  },
} as Command;
