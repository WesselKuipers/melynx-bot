import { inlineCode, SlashCommandBuilder } from '@discordjs/builders';
import {
  ActionRowBuilder,
  SelectMenuBuilder,
  Role,
  SelectMenuInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { getGuildSettings } from '../utils';
import { MelynxCommand } from '../types';
import { prisma } from '../../server/db/client';

export const role: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Set or remove self-assignable roles.')
    .addSubcommand((subcommand) =>
      subcommand.setName('assign').setDescription('Assign self-assignable roles to yourself.')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('unassign').setDescription('Unassign self-assignable roles to yourself.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a role that can be self-assigned.')
        .addRoleOption((option) =>
          option.setName('role').setDescription('The role to add.').setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('description')
            .setDescription('The description for the role.')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a role that can be self-assigned.')
        .addRoleOption((option) =>
          option.setName('role').setDescription('The role to remove.').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('description').setDescription('The description of the role.')
        )
    ) as SlashCommandBuilder,

  async execute(interaction, client) {
    if (!interaction.isChatInputCommand() || !interaction.guild || !interaction.channel) {
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const roles = await prisma.role.findMany({
      where: {
        guildId: interaction.guild.id,
      },
    });

    const member = await interaction.guild.members.fetch(interaction.user);

    if (subcommand === 'assign' || subcommand === 'unassign') {
      if (!roles.length) {
        await interaction.reply({
          ephemeral: true,
          content: 'Looks like there aren’t any self-assignable roles, nya...',
        });
        return;
      }

      const items = roles
        .filter((role) =>
          subcommand === 'assign'
            ? !member.roles.cache.has(role.id)
            : member.roles.cache.has(role.id)
        )
        .map((role) => ({
          label: role.name,
          value: role.id,
          description: role.description ?? '',
        }));

      if (!items.length) {
        await interaction.reply({
          ephemeral: true,
          content:
            'Looks like there aren’t any self-assignable roles that you don’t already have, nya...',
        });
        return;
      }
      const row = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId(`role/${subcommand}`)
          .setPlaceholder('Nothing selected')
          .setMinValues(1)
          .addOptions(items)
      );

      await interaction.reply({
        content: `Select one or multiple roles you’d like to ${subcommand}`,
        ephemeral: true,
        components: [row],
      });

      return;
    }

    const config = await getGuildSettings(client, interaction.guild.id);
    const isAllowed =
      client.options.ownerId === interaction.user.id ||
      member.permissions.has(PermissionFlagsBits.ManageRoles) ||
      member.roles.cache.some(
        (role) =>
          role.id === config.adminRole ||
          role.name === config.adminRole ||
          role.id === config.modRole ||
          role.name === config.modRole
      );

    if (!isAllowed) {
      await interaction.reply({
        ephemeral: true,
        content: 'You do not have the correct permissions to run this command.',
      });
      return;
    }

    const role = interaction.options.getRole('role') as Role;

    if (!role.editable) {
      await interaction.reply({
        ephemeral: true,
        content: 'I’m not allowed to assign this role.',
      });
      return;
    }

    if (subcommand === 'add') {
      const description = interaction.options.getString('description', false);
      const exists = await prisma.role.count({ where: { id: role.id } });

      if (!exists) {
        await interaction.reply(`Self-assignyable role ${role.name} already exists`);
        return;
      }

      await prisma.role.create({
        data: {
          id: role.id,
          guildId: interaction.guild.id,
          name: role.name,
          description,
        },
      });

      await interaction.reply(`Added self-assignyable role ${role.name}`);
      return;
    }

    if (subcommand === 'remove') {
      try {
        const result = await prisma.role.delete({ where: { id: role.id } });

        if (result) {
          await interaction.reply('Remeowved role.');
          return;
        }
      } catch {
        await interaction.reply('This role was already not self-assignyable.');
      }

      return;
    }
  },
  async componentExecute(interaction: SelectMenuInteraction, client) {
    const [, subcommand] = interaction.customId.split('/');
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    const readableRoles = interaction.values.map((value) =>
      inlineCode(
        client.guilds.cache.get(interaction.guild!.id)?.roles?.cache?.get(value)?.name || ''
      )
    );

    if (subcommand === 'unassign') {
      await member.roles.remove(interaction.values);
    } else {
      await member.roles.add(interaction.values);
    }

    await interaction.update({
      content: `You selected: ${readableRoles.join(', ')}`,
      components: [],
    });

    await interaction.channel!.send(
      `${interaction.user}, ${
        subcommand === 'unassign' ? 'unassigned' : 'assigned'
      } roles: ${readableRoles.join(', ')}`
    );
  },
};
