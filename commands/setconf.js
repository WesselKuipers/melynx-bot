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

  async run(client, message, conf, params) {
    const [prop, ...value] = params;
    const config = { ...client.defaultSettings, ...conf };

    if(!config.hasOwnProperty(prop)) {
      return message.reply('This key is not in the configuration.');
    }

    const update = await client.settings.update({ 
      settings: { 
        ...config,
        [prop]: value.join(' ')},
    }, { where: { guildId: message.guild.id }});
    if (update > 0) {
      message.channel.send(`Guild configuration item ${prop} has been changed to:\n\`${value.join(' ')}\``);
    }
  }
}
