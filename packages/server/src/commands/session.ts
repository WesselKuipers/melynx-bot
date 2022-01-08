import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageActionRow, MessageButton } from 'discord.js';
import { buildSessionMessage } from '../bot/utils';
import { MelynxClient, MelynxCommand, Session } from '../types';

const iceborneRegex = /[a-zA-Z0-9#]{4} [a-zA-Z0-9]{4} [a-zA-Z0-9]{4}/;
const pcRegex = /[a-zA-Z0-9#+?@$#&!=-]{12}/;
const mhguRegex = /\b\d{2}-\d{4}-\d{4}-\d{4}\b/;
const riseRegex = /^\w{6}$/;

function validateSession(session: string): string {
  const id = session.replace(/\[|\]/g, ' ').replace(/\s+/g, ' ').trim();
  const foundIceborne = iceborneRegex.test(id);
  const foundPC = pcRegex.test(id);
  const foundMHGU = mhguRegex.test(id);
  const foundRise = riseRegex.test(id.split(' ')?.[0]);

  return foundMHGU || foundPC || foundIceborne || foundRise ? id : null;
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
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      await handleList(interaction, client);
      return;
    }

    const id = validateSession(interaction.options.getString('session'));

    if (!id) {
      return interaction.reply({ content: 'Could not find any sessions, nya...', ephemeral: true });
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
  const session = client.sessionManager.sessions.find(
    (s) => s.sessionId === sessionId && s.guildId === interaction.guildId
  );
  const description = interaction.options.getString('description');
  const newId = interaction.options.getString('new-session');

  if (!session) {
    return interaction.reply({
      content: 'A session with that ID does not exist, nya...',
      ephemeral: true,
    });
  }

  if (newId) {
    const id = validateSession(interaction.options.getString('session'));
    if (!id) {
      return interaction.reply({
        content: `The new session ID does not seem to be valid.`,
        ephemeral: true,
      });
    }

    session.sessionId = id;
  }

  if (description) {
    session.description = description;
  }

  await client.sessionManager.removeSession(session);
  await client.sessionManager.addSession(session);

  return description || newId
    ? interaction.reply(`Updated and refreshed session ${sessionId}`)
    : interaction.reply(`Refreshed session ${sessionId}`);
}

async function handleAdd(
  interaction: CommandInteraction,
  client: MelynxClient,
  sessionId: string
): Promise<void> {
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
      (s) => s.sessionId === session.sessionId && s.guildId === session.guildId
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
          .setLabel('Rise (Switch)')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId(`session/${sessionId}/Rise (PC)`)
          .setLabel('Rise (PC)')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId(`session/${sessionId}/MHGU (Switch)`)
          .setLabel('MHGU (Switch)')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId(`session/${sessionId}/World (Playstation)`)
          .setLabel('World (Playstation)')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId(`session/${sessionId}/World (PC)`)
          .setLabel('World (PC)')
          .setStyle('PRIMARY'),
      ]),
      new MessageActionRow().addComponents([
        new MessageButton()
          .setCustomId(`session/${sessionId}/World (Xbox)`)
          .setLabel('World (Xbox)')
          .setStyle('PRIMARY'),
      ]),
    ],
  });

  console.log({ userId: interaction.user.id, sessionId: session.sessionId });
  const collector = interaction.channel.createMessageComponentCollector({
    filter: (i) =>
      i.user.id === interaction.user.id && i.customId.startsWith(`session/${session.sessionId}`),
    time: 15e3,
  });

  collector.once('collect', async (i) => {
    session.platform = i.customId.split('/').pop();
    await client.sessionManager.addSession(session as Session);
    await client.sessionManager.updateSessionMessage(client, session.guildId);
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
