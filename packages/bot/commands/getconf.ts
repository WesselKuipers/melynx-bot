import { Command, PermissionLevel } from '../types/command';

export default {
  config: {
    enabled: true,
    permissionLevel: PermissionLevel.Admin,
    aliases: ['getconfig'],
    guildOnly: true,
    ownerOnly: false,
  },

  help: {
    name: 'getconf',
    description: 'Lists server-specific config settings',
    usage: '{prefix} getconf',
  },

  run: async (client, message, conf) => {
    const config = { ...client.defaultSettings, ...conf };
    await message.channel.send(`\`\`\`${JSON.stringify(config, null, 2)}\`\`\``);
  },
} as Command;
