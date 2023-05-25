import { SlashCommandBuilder, codeBlock } from '@discordjs/builders';
import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { getGuildSettings, updateGuildSettings } from '../utils';
import { MelynxCommand, PermissionLevel } from '../types';

export const getconf: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Get or set the bot’s config for this server.')
    .addSubcommandGroup((group) =>
      group
        .setName('get')
        .setDescription('View the current settings for this server.')
        .addSubcommand((subcommand) =>
          subcommand.setName('config').setDescription('View the current settings for this server.')
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('set')
        .setDescription('Update a setting')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('session-timeout')
            .setDescription('Set the duration of a session (in seconds)')
            .addIntegerOption((option) =>
              option.setName('timeout').setDescription('The duration').setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('session-refresh-timeout')
            .setDescription(
              'Set the duration of how long a user has to refresh an expired session (in seconds)'
            )
            .addIntegerOption((option) =>
              option.setName('timeout').setDescription('The duration').setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('mod-role')
            .setDescription('Set the mod role.')
            .addRoleOption((option) =>
              option.setName('role').setDescription('The role').setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('admin-role')
            .setDescription('Set the admin role.')
            .addRoleOption((option) =>
              option.setName('role').setDescription('The role').setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('session-channel')
            .setDescription('Set the channel in which the sessions are listed.')
            .addChannelOption((option) =>
              option.setName('channel').setDescription('The channel').setRequired(true)
            )
        )
    ) as SlashCommandBuilder,

  async execute(interaction, client) {
    if (!interaction.isChatInputCommand() || !interaction.guildId) {
      return;
    }

    const member = interaction.member as GuildMember;
    const settings = await getGuildSettings(client, interaction.guildId);

    const isAllowed =
      client.options.ownerId === interaction.user.id ||
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.roles.cache.some(
        (role) => role.id === settings.adminRole || role.name === settings.adminRole
      );

    if (!isAllowed) {
      await interaction.reply({
        ephemeral: true,
        content: 'You do not have the correct permissions to run this command.',
      });

      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup();

    if (group === 'get') {
      await interaction.reply({
        content: codeBlock(JSON.stringify(settings, null, 2)),
        ephemeral: true,
      });

      return;
    }

    let updatedValue;

    if (subcommand === 'session-timeout') {
      updatedValue = interaction.options.getInteger('timeout')! * 1000;
      settings.sessionTimeout = updatedValue;
    }

    if (subcommand === 'session-refresh-timeout') {
      updatedValue = interaction.options.getInteger('timeout')! * 1000;
      settings.sessionRefreshTimeout = updatedValue;
    }

    if (subcommand === 'mod-role') {
      updatedValue = interaction.options.getRole('role')!.id;
      settings.modRole = updatedValue;
    }

    if (subcommand === 'admin-role') {
      updatedValue = interaction.options.getRole('role')!.id;
      settings.adminRole = updatedValue;
    }

    if (subcommand === 'session-channel') {
      updatedValue = interaction.options.getChannel('channel')!.id;
      settings.sessionChannel = updatedValue;
    }

    const updated = updateGuildSettings(client, interaction.guildId, settings);
    if (!updated) {
      return;
    }
    await interaction.reply({
      content: `Guild configuration item \`${subcommand}\` has been changed to:\n\`${updatedValue}\``,
      ephemeral: true,
    });
  },
};
