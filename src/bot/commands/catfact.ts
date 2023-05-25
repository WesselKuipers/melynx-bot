import { MelynxCommand } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';
import { getCatFact } from '../utils';

export const catfact: MelynxCommand = {
  data: new SlashCommandBuilder().setName('catfact').setDescription('Fetches a random cat fact'),
  async execute(interaction) {
    const catfact = await getCatFact();

    await interaction.reply({
      embeds: [
        {
          description: catfact.fact,
        },
      ],
    });
  },
};
