export default class SetConf {
  constructor() {
    this.config = {
      enabled: true,
      permissionLevel: 0,
      aliases: [],
      guildOnly: true,
      ownerOnly: true,
      cooldown: 5,
    };

    this.help = {
      name: 'setconf',
      description: 'Sets server-specific config settings',
      usage: 'setconf [prop] [value]',
    };
  }

  run(client, message, params) {
    const [prop, ...value] = params;

    if(!client.settings.has(message.guild.id, prop)) {
      return message.reply('This key is not in the configuration.');
    }

    client.settings.set(message.guild.id, value.join(' '), prop);
    message.channel.send(`Guild configuration item ${prop} has been changed to:\n\`${value.join(' ')}\``);
  }
}
