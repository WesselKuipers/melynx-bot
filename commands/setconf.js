import dotProp from 'dot-prop';

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
      usage: '{prefix} setconf [prop] [value]',
    };
  }

  async run(client, message, conf, params) {
    const [prop, ...value] = params;
    const config = { ...client.defaultSettings, ...conf };

    // replaces any mentions with regular IDs
    const cleanedProp = prop.replace(/<[@|#|&](\d+)>/, '$1');

    const update = await client.settings.update({ 
      settings: { 
        ...dotProp.set(config, cleanedProp, value.join(' '))
      },
    }, { where: { guildId: message.guild.id }});
    if (update > 0) {
      message.channel.send(`Guild configuration item ${cleanedProp} has been changed to:\n\`${value.join(' ')}\``);
    }
  }
}
