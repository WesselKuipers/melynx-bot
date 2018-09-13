const pc = /3pseat[a-zA-Z0-9]{5}/;
const ps4 = /[a-zA-Z0-9]{12}/;
const sw = /\d{2}-\d{4}-\d{4}-\d{4}/;

export default class Session {
  constructor() {
    this.config = {
      enabled: true,
      aliases: ['ses', 's'],
      permissionLevel: 0,
      guildOnly: true,
      cooldown: 5,
    };

    this.help = {
      name: 'session',
      description: 'List all of my commands or info about a specific command.',
      usage: 'session [command name]',
    };
  }

  run(client, message, params) {
    const foundPC = pc.test(message.content);
    const foundPS4 = ps4.test(message.content);
    const foundSwitch = sw.test(message.content);

    if (foundPC) {
      message.channel.send('Found PC lobby');
      return;
    }

    if (foundSwitch) {
      message.channel.send('Found Switch lobby');
      return;
    }

    if (foundPS4 && !foundPC) {
      message.channel.send('Found PS4 lobby');
      return;
    }
  }
}
