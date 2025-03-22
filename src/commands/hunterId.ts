import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js';
import { type MelynxClient, type MelynxCommand } from '../types';
import { prisma } from '../db';

// Alphanumeric characters except for 0, 1, O, and I
const hunterIdRegex = /[a-hj-np-z2-9]{8}/i;

export const hunterId: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('hunter-id')
    .setDescription('Commands related to Monster Hunter Wilds hunter IDs')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('get')
        .setDescription('Get your or someone else’s hunter ID')
        .addUserOption((option) =>
          option.setName('user').setDescription('The user whose ID you’d like to view')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Set your hunter ID')
        .addStringOption((option) =>
          option.setName('id').setDescription('Your hunter ID.').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('remove').setDescription('Remove your hunter ID')
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

async function handleRemove(
  interaction: ChatInputCommandInteraction,
  client: MelynxClient
): Promise<void> {
  const hunterId = await prisma.hunterId.findUnique({ where: { id: interaction.user.id } });

  if (!hunterId) {
    await interaction.reply({
      content:
        'Looks like you don’t have a hunter ID saved, so I’m just going to take a nap instead, nya!',
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  await prisma.hunterId.delete({ where: { id: hunterId.id } });
  await interaction.reply(`Successfully remeowved your hunter ID.`);
  return;
}

async function handleGet(
  interaction: ChatInputCommandInteraction,
  client: MelynxClient
): Promise<void> {
  const member = interaction.options.getUser('user') || interaction.user;
  const hunterId = await prisma.hunterId.findUnique({ where: { id: member.id } });

  if (member.id === interaction.user.id) {
    if (!hunterId) {
      await interaction.reply(`It looks like you haven’t set your hunter ID yet!`);
      return;
    }

    await interaction.reply(
      `@<${interaction.user.id}>, your hunter ID is **${hunterId.hunterId}**`
    );
    return;
  }

  if (!hunterId) {
    await interaction.reply(`It looks like ${member.username} hasn’t set their hunter ID yet!`);
    return;
  }

  await interaction.reply(`@<${member.id}>’s hunter ID is **${hunterId.hunterId}**`);
}

async function handleSet(interaction: ChatInputCommandInteraction): Promise<void> {
  const code = interaction.options.getString('hunter-id') || '';

  if (!code.match(hunterIdRegex)) {
    await interaction.reply({
      content: 'This hunter ID appears to be invalid.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const hunterId = code.toUpperCase();
  const dbId = await prisma.hunterId.findFirst({ where: { hunterId } });

  if (dbId && dbId.id !== interaction.user.id) {
    await interaction.reply({
      content: 'This friend code is already registered to someone else.',
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  const exists = prisma.hunterId.count({
    where: {
      id: interaction.user.id,
    },
  });

  await prisma.hunterId.upsert({
    where: {
      id: interaction.user.id,
    },
    create: {
      id: interaction.user.id,
      hunterId,
    },
    update: {
      hunterId,
    },
  });

  await interaction.reply({
    content: `Successfully ${(await exists) ? 'updated' : 'registered'} your hunter ID!`,
    flags: MessageFlags.Ephemeral,
  });
}
