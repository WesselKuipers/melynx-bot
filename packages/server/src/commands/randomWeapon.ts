import { join } from 'path';

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

import { SlashCommandBuilder } from '@discordjs/builders';
import { MelynxCommand } from '../types';
import { MessageAttachment } from 'discord.js';

export const randomWeapon: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('randomweapon')
    .setDescription('Returns a random weapon for you to use.'),
  async execute(interaction) {
    const weapon = weapons[Math.floor(Math.random() * weapons.length)];
    const attachment = new MessageAttachment(join(weaponPath, `${weapon}.png`));
    attachment.height = 160;
    return interaction.reply({
      files: [attachment],
    });
  },
};
