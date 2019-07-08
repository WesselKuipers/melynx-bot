export default class GetConf {
  constructor() {
    this.config = {
      enabled: true,
      permissionLevel: 0,
      aliases: ['getconfig'],
      guildOnly: true,
      ownerOnly: true,
      cooldown: 5,
    };

    this.help = {
      name: 'getconf',
      description: 'Lists server-specific config settings',
      usage: '{prefix} getconf',
    };
  }

  async run(client, message, conf, params) {
    const config = { ...client.defaultSettings, ...conf };
    message.channel.send('```' + JSON.stringify(config, null, 2) + '```');
  }
}
