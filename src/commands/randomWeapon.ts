import { join } from 'path';

export const weapons = {
  bow: 'Bow',
  cb: 'Charge Blade',
  db: 'Dual Blades',
  gl: 'Gunlance',
  gs: 'Great Sword',
  hammer: 'Hammer',
  hbg: 'Heavy Bowgun',
  hh: 'Hunting Horn',
  ig: 'Insect Glaive',
  lance: 'Lance',
  lbg: 'Light Bowgun',
  ls: 'Long Sword',
  sa: 'Switch Axe',
  sns: 'Sword and Shield',
};
const weaponKeys = Object.keys(weapons);

export const weaponPath = join(assetPath, 'weapons');

import { SlashCommandBuilder } from '@discordjs/builders';
import { type MelynxCommand } from '../types';
import { AttachmentBuilder } from 'discord.js';
import { assetPath } from '~/utils';

export const randomWeapon: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('randomweapon')
    .setDescription('Returns a random weapon for you to use.'),

  async execute(interaction) {
    const weapon = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
    const attachment = new AttachmentBuilder(join(weaponPath, `${weapon!}.png`));
    await interaction.reply({
      files: [attachment],
    });
  },
};
