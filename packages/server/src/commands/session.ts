import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageActionRow, MessageButton } from 'discord.js';
import { buildSessionMessage } from '../bot/utils';
import { MelynxClient, MelynxCommand, Session } from '../types';

const iceborneRegex = /[a-zA-Z0-9#]{4} [a-zA-Z0-9]{4} [a-zA-Z0-9]{4}/;
const pcRegex = /[a-zA-Z0-9#+?@$#&!=-]{12}/;
const mhguRegex = /\b\d{2}-\d{4}-\d{4}-\d{4}\b/;
const riseRegex = /^\w{6}$/;

const sessionsInProgress: Map<string, Partial<Session>> = new Map();

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
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      await handleList(interaction, client);
      return;
    }

    const id = interaction.options
      .getString('session')
      .replace(/\[|\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const foundIceborne = iceborneRegex.exec(id);
    const foundPC = pcRegex.exec(id);
    const foundMHGU = mhguRegex.exec(id);
    const foundRise = riseRegex.exec(id.split(' ')?.[0]);

    if (!foundMHGU && !foundPC && !foundIceborne && !foundRise) {
      return interaction.reply({ content: 'Could not find any sessions, nya...', ephemeral: true });
    }

    const sessionId = foundRise?.[0] ?? foundMHGU?.[0] ?? foundPC?.[0] ?? foundIceborne?.[0];

    switch (subcommand) {
      case 'remove':
        await handleRemove(interaction, client, sessionId);
        break;
      case 'add':
        await handleAdd(interaction, client, sessionId);
        break;
      case 'edit':
        await handleEdit(interaction, client, sessionId);
        break;
    }
  },
};

async function handleList(interaction: CommandInteraction, client: MelynxClient): Promise<void> {
  const sessionDb = client.models.session;
  const sessions = await sessionDb.findAll({ where: { guildId: interaction.guildId } });

  return interaction.reply(buildSessionMessage(interaction.guildId, sessions));
}

async function handleRemove(
  interaction: CommandInteraction,
  client: MelynxClient,
  sessionId: string
): Promise<void> {
  const session = client.sessionManager.sessions.find((s) => s.sessionId === sessionId);
  if (!session) {
    return interaction.reply({
      content: 'A session with that ID does not exist, nya...',
    });
  }

  await client.sessionManager.removeSession(session);
  await client.sessionManager.updateSessionMessage(client, interaction.guildId);
  return interaction.reply(`Remeowved session ${session.sessionId}!`);
}

async function handleEdit(
  interaction: CommandInteraction,
  client: MelynxClient,
  sessionId: string
): Promise<void> {
  const sessionDb = client.models.session;
  const sessions = await sessionDb.findAll({ where: { guildId: interaction.guildId } });

  return interaction.reply(buildSessionMessage(interaction.guildId, sessions));
}

async function handleAdd(
  interaction: CommandInteraction,
  client: MelynxClient,
  sessionId: string
): Promise<void> {
  const sessionDb = client.models.session;
  const session: Partial<Session> = {
    userId: interaction.user.id,
    avatar: interaction.user.avatarURL(),
    creator: interaction.user.username,
    date: new Date(),
    guildId: interaction.guildId,
    channelId: interaction.channel.id,
    description: interaction.options.getString('description'),
    sessionId,
  };

  if (
    client.sessionManager.sessions.some(
      (s) =>
        s.sessionId === session.sessionId &&
        s.guildId === session.guildId &&
        s.userId !== interaction.user.id
    )
  ) {
    return interaction.reply({ content: 'A lobby with this ID already exists!', ephemeral: true });
  }

  await interaction.reply({
    ephemeral: true,
    content: `What game is this session for?`,
    components: [
      new MessageActionRow().addComponents([
        new MessageButton()
          .setCustomId(`session/${sessionId}/Rise (Switch)`)
          .setLabel('Rise (Switch)'),
        new MessageButton()
          .setCustomId(`session/${sessionId}/MHGU (Switch)`)
          .setLabel('MHGU (Switch)'),
        new MessageButton()
          .setCustomId(`session/${sessionId}/World (Playstation)`)
          .setLabel('World (Playstation)'),
        new MessageButton().setCustomId(`session/${sessionId}/World (PC)`).setLabel('World (PC)'),
        new MessageButton()
          .setCustomId(`session/${sessionId}/World (Xbox)`)
          .setLabel('World (Xbox)'),
      ]),
    ],
  });

  const collector = interaction.channel.createMessageComponentCollector({
    filter: (i) =>
      i.user.id === interaction.user.id &&
      i.isButton() &&
      i.customId.startsWith(`session/${session.id}`),
    time: 15e3,
  });

  let collected = false;
  collector.once('collect', async (i) => {
    session.platform = i.customId.split('/').pop();
    await client.sessionManager.addSession(session as Session);
    await client.sessionManager.updateSessionMessage(client, session.guildId);
    await interaction.editReply({
      content: 'Successfully created session.',
      components: [],
    });
    await interaction.followUp(`Added ${session.platform} session \`${session.sessionId}\``);
    collected = true;
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
