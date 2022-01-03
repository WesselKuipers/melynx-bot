import { MelynxCommand } from '../types';
import { SlashCommandBuilder } from '@discordjs/builders';
import axios from 'axios';

export const catfact: MelynxCommand = {
  data: new SlashCommandBuilder().setName('catfact').setDescription('Fetches a random cat fact'),
  async execute(interaction) {
    const { data } = await axios.get<{ fact: string }>('https://catfact.ninja/fact');

    await interaction.reply({
      embeds: [
        {
          description: data.fact,
        },
      ],
    });
  },
};
