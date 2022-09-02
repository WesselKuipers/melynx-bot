import { SlashCommandBuilder } from '@discordjs/builders';
import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { buildSessionMessage } from '../utils';
import { MelynxClient, MelynxCommand, Session } from '../types';
import { prisma } from '../../server/db/client';

const iceborneRegex = /[a-zA-Z0-9#]{4} [a-zA-Z0-9]{4} [a-zA-Z0-9]{4}/;
const pcRegex = /[a-zA-Z0-9#+?@$#&!=-]{12}/;
const mhguRegex = /\b\d{2}-\d{4}-\d{4}-\d{4}\b/;
const riseRegex = /^\w{6}$/;

function validateSession(session: string): string {
  const id = session.replace(/\[|\]/g, ' ').replace(/\s+/g, ' ').trim();
  // Temporarily disabled until proper Rise PC update.
  // const foundIceborne = iceborneRegex.test(id);
  // const foundPC = pcRegex.test(id);
  // const foundMHGU = mhguRegex.test(id);
  // const foundRise = riseRegex.test(id.split(' ')?.[0]);

  return id;
}

export const session: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('session')
    .setDescription('Commands related to viewing and adding Monster Hunter sessions')
    .addSubcommand((subcommand) =>
      subcommand.setName('list').setDescription('View the list of active sessions on this server.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a new session.')
        .addStringOption((option) =>
          option.setName('session').setDescription('The session code').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('description').setDescription('The session description')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove an existing session.')
        .addStringOption((option) =>
          option.setName('session').setDescription('The session code').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('description').setDescription('The session description')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('edit')
        .setDescription('Edit an existing session. Doing so will refresh the duration as well.')
        .addStringOption((option) =>
          option.setName('session').setDescription('The session code').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('description').setDescription('The session description')
        )
        .addStringOption((option) =>
          option.setName('new-session').setDescription('The new session code')
        )
    ) as SlashCommandBuilder,

  async execute(interaction, client) {
    if (!interaction.isChatInputCommand() || !interaction.guild || !interaction.channel) {
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      await handleList(interaction, client);
      return;
    }

    const id = validateSession(interaction.options.getString('session') || '');

    if (!id) {
      await interaction.reply({ content: 'Could not find any sessions, nya...', ephemeral: true });
      return;
    }

    switch (subcommand) {
      case 'remove':
        await handleRemove(interaction, client, id);
        break;
      case 'add':
        await handleAdd(interaction, client, id);
        break;
      case 'edit':
        await handleEdit(interaction, client, id);
        break;
    }
  },
};

async function handleList(
  interaction: ChatInputCommandInteraction,
  client: MelynxClient
): Promise<void> {
  const sessions = await prisma.session.findMany({ where: { guildId: interaction.guildId! } });

  await interaction.reply(buildSessionMessage(interaction.guildId!, sessions));
}

async function handleRemove(
  interaction: ChatInputCommandInteraction,
  client: MelynxClient,
  sessionId: string
): Promise<void> {
  const session = client.sessionManager.sessions.find((s) => s.sessionId === sessionId);
  if (!session) {
    await interaction.reply({
      content: 'A session with that ID does not exist, nya...',
    });
    return;
  }

  await client.sessionManager.removeSession(session);
  await client.sessionManager.updateSessionMessage(client, interaction.guildId!);
  await interaction.reply(`Remeowved session ${session.sessionId}!`);
}

async function handleEdit(
  interaction: ChatInputCommandInteraction,
  client: MelynxClient,
  sessionId: string
): Promise<void> {
  const session = client.sessionManager.sessions.find(
    (s) => s.sessionId === sessionId && s.guildId === interaction.guildId
  );
  const description = interaction.options.getString('description');
  const newId = interaction.options.getString('new-session');

  if (!session) {
    await interaction.reply({
      content: 'A session with that ID does not exist, nya...',
      ephemeral: true,
    });
    return;
  }

  if (newId) {
    const id = validateSession(interaction.options.getString('session') || '');
    if (!id) {
      await interaction.reply({
        content: `The new session ID does not seem to be valid.`,
        ephemeral: true,
      });
      return;
    }

    session.sessionId = id;
  }

  if (description) {
    console.log(`Setting description to: ${description}`);
    session.description = description;
  }

  await client.sessionManager.removeSession(session);
  await client.sessionManager.addSession(session);

  const message =
    description || newId
      ? `Updated and refreshed session ${sessionId}`
      : `Refreshed session ${sessionId}`;

  await interaction.reply(description ? `${message}\nDescription: ${description}` : message);
}

async function handleAdd(
  interaction: ChatInputCommandInteraction,
  client: MelynxClient,
  sessionId: string
): Promise<void> {
  const session: Partial<Session> = {
    userId: interaction.user.id,
    avatar: interaction.user.avatarURL() || '',
    creator: interaction.user.username,
    guildId: interaction.guildId!,
    channelId: interaction.channel!.id,
    description: interaction.options.getString('description') || '',
    sessionId,
  };

  if (
    client.sessionManager.sessions.some(
      (s) => s.sessionId === session.sessionId && s.guildId === session.guildId
    )
  ) {
    await interaction.reply({ content: 'A lobby with this ID already exists!', ephemeral: true });
    return;
  }

  await interaction.reply({
    ephemeral: true,
    content: `What game is this session for?`,
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId(`session/${sessionId}/Rise (Switch)`)
          .setLabel('Rise (Switch)')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`session/${sessionId}/Rise (PC)`)
          .setLabel('Rise (PC)')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`session/${sessionId}/MHGU (Switch)`)
          .setLabel('MHGU (Switch)')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`session/${sessionId}/World (Playstation)`)
          .setLabel('World (Playstation)')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`session/${sessionId}/World (PC)`)
          .setLabel('World (PC)')
          .setStyle(ButtonStyle.Primary),
      ]),
      new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId(`session/${sessionId}/World (Xbox)`)
          .setLabel('World (Xbox)')
          .setStyle(ButtonStyle.Primary),
      ]),
    ],
  });

  const collector = interaction.channel!.createMessageComponentCollector({
    filter: (i) =>
      i.user.id === interaction.user.id && i.customId.startsWith(`session/${session.sessionId}`),
    time: 15e3,
  });

  collector.once('collect', async (i) => {
    session.platform = i.customId.split('/').pop();
    await client.sessionManager.addSession(session as Session);
    await client.sessionManager.updateSessionMessage(client, session.guildId!);
    await interaction.editReply({
      content: 'Successfully created session.',
      components: [],
    });
    await interaction.followUp(`Added ${session.platform} session \`${session.sessionId}\``);
  });

  collector.on('end', async (i) => {
    if (i.size === 0) {
      await interaction.editReply({
        content: 'Cancelled creation.',
        components: [],
      });
    }
  });
}
