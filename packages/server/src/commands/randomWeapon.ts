import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../types/melynxClient';
import { join } from 'path';
import { MessageAttachment } from 'discord.js';

const weapons = [
  'bow',
  'cb',
  'db',
  'gl',
  'gs',
  'hammer',
  'hbg',
  'hh',
  'ig',
  'lance',
  'lbg',
  'ls',
  'sa',
  'sns',
];

const weaponPath = join(__dirname, '..', 'assets', 'weapons');

export default class RandomWeapon extends MelynxCommand {
  constructor() {
    super('randomWeapon', {
      aliases: ['randomWeapon', 'rw', 'weapon'],
      description: 'Returns a random weapon for you to use.`',
    });

    this.usage = '{prefix}randomWeapon';
  }

  public async exec(message: MelynxMessage): Promise<Message> {
    const weapon = weapons[Math.floor(Math.random() * weapons.length)];
    const attachment = new MessageAttachment(join(weaponPath, `${weapon}.png`));
    attachment.height = 160;
    return message.util.send(attachment);
  }
}
