import { SlashCommandBuilder } from '@discordjs/builders';
import { MelynxCommand } from '../types';

const emojiRegex = /<(a)?:\w+:\d+>/;

export const bigemote: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('bigemote')
    .setDescription(
      'Display a bigger version of an emote. Currently does not support default emojis.'
    )
    .addStringOption((option) =>
      option
        .setName('emoji')
        .setDescription('The emoji you want to display a bigger version of.')
        .setRequired(true)
    ) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const emoji = interaction.options.getString('emoji') || '';
    if (!emoji.match(emojiRegex)) {
      await interaction.reply({
        ephemeral: true,
        content: 'It looks like this emoji is either a default emoji or not valid.',
      });
      return;
    }

    const id = emoji.split(':').pop()?.slice(0, -1);
    const animated = emoji.startsWith('<a:');

    await interaction.reply({
      files: [`https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?v=1`],
    });
  },
};
