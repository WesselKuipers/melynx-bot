import { SlashCommandBuilder } from '@discordjs/builders';
import { GuildMember } from 'discord.js';
import { getGuildSettings } from '../bot/utils';
import { MelynxCommand } from '../types';

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
    const subcommand = interaction.options.getSubcommand();
    const tagDb = client.models.tag;

    if (subcommand === 'list') {
      const tags = await tagDb.findAll({ where: { guildId: interaction.guildId } });

      if (!tags.length) {
        return interaction.reply('This server currently has no tags.');
      }

      return interaction.reply(`List of tags: \`${tags.map((tag) => tag.name).join('`, `')}\``);
    }

    const name = interaction.options.getString('tag');
    if (subcommand === 'get') {
      const tag = await tagDb.findOne({ where: { guildId: interaction.guildId, name } });

      if (!tag) {
        await interaction.reply(`Could not find a tag called ${name}, nya!`);
        return;
      }

      return interaction.reply(`>>> ${tag.content}`);
    }

    const config = await getGuildSettings(client, interaction.guildId);
    const member = interaction.member as GuildMember;
    const isAllowed =
      client.options.ownerId === interaction.user.id ||
      member.permissions.has('MANAGE_MESSAGES') ||
      member.roles.cache.some(
        (role) =>
          role.id === config.adminRole ||
          role.name === config.adminRole ||
          role.id === config.modRole ||
          role.name === config.modRole
      );

    if (!isAllowed) {
      return interaction.reply({
        ephemeral: true,
        content: 'You do not have the correct permissions to run this command.',
      });
    }

    const tag = await tagDb.findOne({ where: { guildId: interaction.guildId, name } });
    if (subcommand === 'set') {
      const content = interaction.options.getString('value');

      if (!tag) {
        await tagDb.create({ guildId: interaction.guildId, name, content });
        return interaction.reply(`Created tag \`${name}\`.`);
      } else {
        await tag.update({ content });
        return interaction.reply(`Updated tag \`${name}\`.`);
      }
    }

    if (subcommand === 'remove') {
      if (!tag) {
        return interaction.reply(`Tag \`${name}\` doesn't exist!`);
      } else {
        await tag.destroy();
        return interaction.reply(`Deleted tag \`${name}\`.`);
      }
    }
  },
};
