export default class Ping {
  constructor() {
    this.config = {
      enabled: true,
      aliases: ['p'],
      permissionLevel: 0,
      guildOnly: true,
      cooldown: 5,
    };

    this.help = {
      name: 'ping',
      description: 'Pings the bot, will respond with `Pong! ([latency] ms)`',
      usage: 'ping',
    };
  }

  run(client, message) {
    message.channel.send(`Pong! (${new Date().getTime() - message.createdTimestamp} ms)`);
  }
}
