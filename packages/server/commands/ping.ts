import Command, { PermissionLevel } from '../types/command';

export default {
  config: {
    enabled: true,
    aliases: ['p'],
    permissionLevel: PermissionLevel.Anyone,
    guildOnly: true,
    ownerOnly: false,
  },

  help: {
    name: 'ping',
    description: 'Pings the bot, will respond with `Pong! ([latency] ms)`',
    usage: '{prefix} ping',
  },

  run: async (_, message) => {
    await message.channel.send(
      `Pong! (${Math.abs(new Date().getTime() - message.createdTimestamp)} ms)`
    );
  },
} as Command;
