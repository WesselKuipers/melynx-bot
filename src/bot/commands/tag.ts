import { SlashCommandBuilder } from '@discordjs/builders';
import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { getGuildSettings } from '../utils';
import { MelynxCommand } from '../types';
import { prisma } from '../../server/db/client';

export const tag: MelynxCommand = {
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Get or create custom tags')
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('Get a list of tags'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('get')
        .setDescription('Get a tag')
        .addStringOption((option) =>
          option.setName('tag').setDescription('The tag you want to display.').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a tag')
        .addStringOption((option) =>
          option.setName('tag').setDescription('The tag you want to remove.').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Create or update a tag')
        .addStringOption((option) =>
          option.setName('tag').setDescription('The tag you want to set.').setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('value')
            .setDescription('The value of the tag you want to set.')
            .setRequired(true)
        )
    ) as SlashCommandBuilder,

  async execute(interaction, client) {
    if (!interaction.isChatInputCommand() || !interaction.guildId) {
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const tags = await prisma.tag.findMany({ where: { guildId: interaction.guildId } });

      if (!tags.length) {
        await interaction.reply('This server currently has no tags.');
        return;
      }

      await interaction.reply(`List of tags: \`${tags.map((tag) => tag.name).join('`, `')}\``);
      return;
    }

    const name = interaction.options.getString('tag')!;
    if (subcommand === 'get') {
      const tag = await prisma.tag.findFirst({ where: { guildId: interaction.guildId, name } });

      if (!tag) {
        await interaction.reply(`Could not find a tag called ${name}, nya!`);
        return;
      }

      await interaction.reply(`>>> ${tag.content}`);
      return;
    }

    const config = await getGuildSettings(client, interaction.guildId);
    const member = interaction.member as GuildMember;
    const isAllowed =
      client.options.ownerId === interaction.user.id ||
      member.permissions.has(PermissionFlagsBits.ManageMessages) ||
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

    const tag = await prisma.tag.findFirst({ where: { guildId: interaction.guildId, name } });
    if (subcommand === 'set') {
      const content = interaction.options.getString('value')!;

      if (!tag) {
        await prisma.tag.create({ data: { guildId: interaction.guildId, name, content } });
        await interaction.reply(`Created tag \`${name}\`.`);
      } else {
        await prisma.tag.update({
          data: { content },
          where: { id: tag.id },
        });
        await interaction.reply(`Updated tag \`${name}\`.`);
      }

      return;
    }

    if (subcommand === 'remove') {
      if (!tag) {
        await interaction.reply(`Tag \`${name}\` doesn't exist!`);
      } else {
        await prisma.tag.delete({ where: { id: tag.id } });
        await interaction.reply(`Deleted tag \`${name}\`.`);
      }
    }
  },
};
