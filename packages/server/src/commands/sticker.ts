import { SlashCommandBuilder } from '@discordjs/builders';
import fs from 'fs';
import path from 'path';
import { MelynxCommand } from '../types';

const stickerPath = path.join(__dirname, '..', 'assets', 'stickers');
const files = fs.readdirSync(stickerPath);
const stickers = files.map((file) => {
  return {
    name: file.split('.')[0],
    path: path.join(stickerPath, file),
  };
});

export const sticker: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('sticker')
    .setDescription('Sends a sticker. Type `list` to see the list of stickers.')
    .addStringOption((option) =>
      option
        .setName('sticker')
        .setDescription(
          'The sticker you want to send. Type `list` to see a list of available stickers.'
        )
    ) as SlashCommandBuilder,
  async execute(interaction, client) {
    const sticker = interaction.options.getString('sticker');

    if (
      !sticker ||
      sticker === 'list' ||
      !stickers.some((s) => s.name.toLocaleLowerCase() !== sticker.toLocaleLowerCase())
    ) {
      await interaction.reply({
        ephemeral: true,
        content: `You can view a list of stickers at https://${client.options.host}/stickers`,
      });
      return;
    }

    await interaction.reply({
      files: [stickers.find((s) => s.name.toLowerCase() === sticker.toLowerCase()).path],
    });
  },
};
