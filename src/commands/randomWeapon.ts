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

const weaponPath =
  env.NODE_ENV === 'development'
    ? join(process.cwd(), '../..', 'assets', 'weapons')
    : join(process.cwd(), 'assets', 'weapons');

import { SlashCommandBuilder } from '@discordjs/builders';
import { type MelynxCommand } from '../types';
import { AttachmentBuilder } from 'discord.js';
import { env } from '~/types/serverEnvSchema';

export const randomWeapon: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('randomweapon')
    .setDescription('Returns a random weapon for you to use.'),

  async execute(interaction) {
    const weapon = weapons[Math.floor(Math.random() * weapons.length)];
    const attachment = new AttachmentBuilder(join(weaponPath, `${weapon!}.png`));
    await interaction.reply({
      files: [attachment],
    });
  },
};
