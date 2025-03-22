import { join } from 'path';
import { weaponPath, weapons } from './randomWeapon';

import { EmbedBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { type MelynxCommand } from '../types';
import { AttachmentBuilder } from 'discord.js';
import { assetPath } from '~/utils';
import { monsters } from '~/data/monsters';
import { elementEmojis } from '~/data/elementEmojis';

const monsterIconPaths = join(assetPath, 'monsters');

export const randomHunt: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('randomhunt')
    .setDescription('Returns a random monster to hunt (in Wilds for now).')
    .addBooleanOption((option) =>
      option.setName('randomweapon').setDescription('Also include a random weapon')
    ) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.isChatInputCommand() || !interaction.guildId) {
      return;
    }

    const withWeapon = interaction.options.getBoolean('randomweapon');
    const monster = monsters[Math.floor(Math.random() * monsters.length)];
    const icon = `${monster.name.replace(/[ -]/g, '').toLocaleLowerCase()}.webp`;

    const embed = new EmbedBuilder();
    const files = [new AttachmentBuilder(join(monsterIconPaths, icon))];

    embed.setTitle(monster.name);
    embed.setDescription(monster.description);
    embed.setThumbnail(`attachment://${icon}`);

    embed.addFields([
      {
        name: 'Weakness',
        value: `${elementEmojis[monster.weakness]} ${monster.weakness}`,
      },
    ]);

    if (withWeapon) {
      const weaponKeys = Object.keys(weapons) as Array<keyof typeof weapons>;
      const weaponKey = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
      const weapon = weapons[weaponKey];

      files.push(new AttachmentBuilder(join(weaponPath, `${weaponKey}.png`)));

      embed.setFooter({
        text: `with ${weapon}`,
        iconURL: `attachment://${weaponKey}.png`,
      });
    }

    await interaction.reply({
      files,
      embeds: [embed],
    });
  },
};
