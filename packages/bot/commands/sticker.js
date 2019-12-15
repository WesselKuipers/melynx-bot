import fs from 'fs';
import path from 'path';
import Discord, { RichEmbed } from 'discord.js';

const files = fs.readdirSync(path.join(__dirname, 'stickers'));
const stickers = files.map(file => {
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
      aliases: ['stamp', 'st'],
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

      if (command.toLowerCase() === 'list') {
        message.channel.send(
          `\`\`\`${stickers.map(sticker => sticker.name).join(', ')}\`\`\``
        );

        return;
      }

      const sticker = stickers.find(
        s => s.name.toLowerCase() === command.toLowerCase()
      );
      if (!sticker) {
        message.channel.send(`Could nyot find this sticker..`);
        return;
      }

      const embed = new RichEmbed()
        .attachFile(new Discord.Attachment(sticker.path, `${sticker.name}.png`))
        .setImage(`attachment://${sticker.name}.png`);

      message.channel.send({ embed });
    };
  }
}