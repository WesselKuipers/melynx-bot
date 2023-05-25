import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import { MelynxClient, MelynxCommand } from '../types';
import { prisma } from '../../server/db/client';

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
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case 'remove':
        await handleRemove(interaction, client);
        break;
      case 'get':
        await handleGet(interaction, client);
        break;
      case 'set':
        await handleSet(interaction);
        break;
    }
  },
};

async function handleRemove(interaction: CommandInteraction, client: MelynxClient): Promise<void> {
  // const fc = await client.models.friendCode.findByPk(interaction.user.id);
  const fc = await prisma.friendCode.findUnique({ where: { id: interaction.user.id } });

  if (!fc) {
    await interaction.reply({
      content:
        'Looks like you didn’t have a friend code, so I’m just going to take a nap instead, nya!',
      ephemeral: true,
    });

    return;
  }

  await prisma.friendCode.delete({ where: { id: fc.id } });
  await interaction.reply(`Successfully remeowved your friend code.`);
  return;
}

async function handleGet(interaction: CommandInteraction, client: MelynxClient): Promise<void> {
  const member = interaction.options.getUser('user') || interaction.user;
  const fc = await prisma.friendCode.findUnique({ where: { id: member.id } });

  if (member.id === interaction.user.id) {
    if (!fc) {
      await interaction.reply(`It looks like you haven’t set your friend code yet!`);
      return;
    }

    await interaction.reply(`${interaction.user}, your friend code is **${fc.fc}**`);
    return;
  }

  if (!fc) {
    await interaction.reply(`It looks like ${member.username} hasn’t set their friend code yet!`);
    return;
  }

  await interaction.reply(`${member}’s friend code is **${fc.fc}**`);
}

async function handleSet(interaction: ChatInputCommandInteraction): Promise<void> {
  const code = interaction.options.getString('fc') || '';

  if (!code.match(fcRegex)) {
    await interaction.reply({ content: 'This FC appears to be invalid.', ephemeral: true });
    return;
  }

  const fc = code.replace(/\D/g, '');
  const normalizedFc = `SW-${fc.substring(0, 4)}-${fc.substring(4, 4)}-${fc.substring(8, 4)}`;

  const dbFC = await prisma.friendCode.findFirst({ where: { fc: normalizedFc } });
  if (dbFC && dbFC.id !== interaction.user.id) {
    await interaction.reply({
      content: 'This friend code is already registered to someone else.',
      ephemeral: true,
    });

    return;
  }

  const exists = prisma.friendCode.count({
    where: {
      id: interaction.user.id,
    },
  });

  await prisma.friendCode.upsert({
    where: {
      id: interaction.user.id,
    },
    create: {
      id: interaction.user.id,
      fc: normalizedFc,
    },
    update: {
      fc: normalizedFc,
    },
  });

  await interaction.reply({
    content: `Successfully ${(await exists) ? 'updated' : 'registered'} your friend code!`,
    ephemeral: true,
  });
}
