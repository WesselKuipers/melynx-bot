import { SlashCommandBuilder } from '@discordjs/builders';
import fs from 'fs';
import path from 'path';
import { type MelynxCommand } from '../types';
import { MessageFlags } from 'discord.js';

const stickerPath = path.join(process.cwd(), 'public', 'images', 'stickers');
const files = fs.readdirSync(stickerPath);
const stickers = files.map((file) => {
  return {
    name: file.split('.')[0] || file,
    path: path.join(stickerPath, file),
  };
});
const names = stickers.map((sticker) => sticker.name);

export const sticker: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('sticker')
    .setDescription('Sends a sticker. Type `list` to see the list of stickers.')
    .addStringOption((option) =>
      option
        .setName('sticker')
        .setDescription('The sticker you want to send.')
        .setAutocomplete(true)
    ) as SlashCommandBuilder,

  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const stickerName = interaction.options.getString('sticker');

    if (stickerName === 'list') {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `\`${names.join('`, `')}\``,
      });
      return;
    }

    const sticker = stickers.find(
      (s) => s.name.toLocaleLowerCase() === stickerName?.toLocaleLowerCase()
    );

    if (!stickerName || !sticker) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `Couldn’t find sticker ${stickerName}`,
      });
      return;
    }

    await interaction.reply({
      files: [sticker.path],
    });
  },

  async autocompleteExecute(interaction) {
    const focusedValue = interaction.options.getFocused();
    await interaction.respond(
      ['list', ...names]
        .filter((name) => name.startsWith(focusedValue))
        .map((choice) => ({ name: choice, value: choice }))
        .slice(0, 25)
    );
  },
};
