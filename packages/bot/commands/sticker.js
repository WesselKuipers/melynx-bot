import Discord, { MessageEmbed } from 'discord.js';
import fs from 'fs';
import path from 'path';

const files = fs.readdirSync(path.join(__dirname, 'stickers'));
const stickers = files.map((file) => {
  return {
    name: file.split('.')[0],
    path: path.join(__dirname, 'stickers', file),
  };
});

export default class Sticker {
  constructor() {
    this.config = {
      enabled: true,
      permissionLevel: 0,
      aliases: ['stamp', 'st', 'stickers'],
      guildOnly: true,
      ownerOnly: false,
      cooldown: 5,
    };

    this.help = {
      name: 'sticker',
      description: 'Sends a sticker',
      usage: '\n{prefix} [sticker name]\n{prefix} list',
    };

    /**
     * @param {Discord.Client} client
     * @param {Discord.Message} message
     * @param {Object} conf
     * @param {String[]} params
     */
    this.run = async (client, message, conf, params) => {
      const [command] = params;

      if (!command || command.toLowerCase() === 'list') {
        message.channel.send(
          `You can view a list of stickers at https://${client.options.host}/stickers`
        );

        return;
      }

      const sticker = stickers.find((s) => s.name.toLowerCase() === command.toLowerCase());
      if (!sticker) {
        message.channel.send(`Could nyot find this sticker..`);
        return;
      }

      const embed = new MessageEmbed()
        .attachFile(new Discord.Attachment(sticker.path, `${sticker.name}.png`))
        .setImage(`attachment://${sticker.name}.png`);

      message.channel.send({ embed });
    };
  }
}
