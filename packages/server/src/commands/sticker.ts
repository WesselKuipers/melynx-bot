import { FailureData } from 'discord-akairo';
import { MessageEmbed } from 'discord.js';
import { Message } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { MelynxCommand, MelynxMessage } from '../types/melynxClient';

const stickerPath = path.join(__dirname, 'stickers');
const files = fs.readdirSync(stickerPath);
const stickers = files.map((file) => {
  return {
    name: file.split('.')[0],
    path: path.join(stickerPath, file),
  };
});

export default class Sticker extends MelynxCommand {
  constructor() {
    super('sticker', {
      aliases: ['sticker', 'stamp', 'emote'],
      description: 'Sends a sticker',
      args: [
        {
          id: 'sticker',
          type: ['list', ...stickers.map((s) => s.name)],
          default: 'list',
          otherwise: (message: MelynxMessage, data: FailureData) =>
            data.phrase
              ? 'Could nyot find this sticker..'
              : `You can view a list of stickers at https://${message.client.options.host}/stickers`,
        },
      ],
    });

    this.usage = '{prefix}sticker [sticker name]\n{prefix}sticker list';
  }

  public async exec(message: MelynxMessage, { sticker }: { sticker: string }): Promise<Message> {
    return message.util.send({
      embed: new MessageEmbed()
        .attachFiles([stickers.find((s) => s.name.toLowerCase() === sticker.toLowerCase()).path])
        .setImage(`attachment://${sticker}.png`),
    });
  }
}
