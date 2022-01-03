import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { MelynxClient, MelynxCommand } from '../types';

const fcRegex = /((SW[- ]?)?)(\d{4}[- ]?){2}\d{4}/i;

export const fc: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('fc')
    .setDescription('Commands related to Nintendo Switch friend codes')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('get')
        .setDescription('Get your or someone else’s friend code')
        .addUserOption((option) =>
          option.setName('user').setDescription('The user whose FC you’d like to view')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Set your friend code')
        .addStringOption((option) =>
          option.setName('fc').setDescription('Your friend code.').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('remove').setDescription('Remove your friend code')
    ) as SlashCommandBuilder,

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case 'remove':
        await handleRemove(interaction, client);
        break;
      case 'get':
        await handleGet(interaction, client);
        break;
      case 'set':
        await handleSet(interaction, client);
        break;
    }
  },
};

async function handleRemove(interaction: CommandInteraction, client: MelynxClient): Promise<void> {
  const fc = await client.models.friendCode.findByPk(interaction.user.id);

  if (!fc) {
    return interaction.reply({
      content:
        'Looks like you didn’t have a friend code, so I’m just going to take a nap instead, nya!',
      ephemeral: true,
    });
  }

  await fc.destroy();
  return interaction.reply(`Successfully remeowved your friend code.`);
}

async function handleGet(interaction: CommandInteraction, client: MelynxClient): Promise<void> {
  const member = interaction.options.getUser('user') || interaction.user;
  const fc = await client.models.friendCode.findByPk(member.id);

  if (member.id === interaction.user.id) {
    if (!fc) {
      return interaction.reply(`It looks like you haven’t set your friend code yet!`);
    }

    return interaction.reply(`${interaction.user}, your friend code is **${fc.fc}**`);
  }

  if (!fc) {
    return interaction.reply(`It looks like ${member.username} hasn’t set their friend code yet!`);
  }

  return interaction.reply(`${member}’s friend code is **${fc.fc}**`);
}

async function handleSet(interaction: CommandInteraction, client: MelynxClient): Promise<void> {
  const code = interaction.options.getString('fc');

  if (!code.match(fcRegex)) {
    return interaction.reply({ content: 'This FC appears to be invalid.', ephemeral: true });
  }

  const fc = code.replace(/\D/g, '');
  const normalizedFc = `SW-${fc.substr(0, 4)}-${fc.substr(4, 4)}-${fc.substr(8, 4)}`;

  const dbFC = await client.models.friendCode.findOne({ where: { fc: normalizedFc } });
  if (dbFC && dbFC.id !== interaction.user.id) {
    return interaction.reply({
      content: 'This friend code is already registered to someone else.',
      ephemeral: true,
    });
  }

  const [, updated] = await client.models.friendCode.upsert({
    id: interaction.user.id,
    fc: normalizedFc,
  });

  return interaction.reply({
    content: `Successfully ${updated ? 'updated' : 'registered'} your friend code!`,
    ephemeral: true,
  });
}
