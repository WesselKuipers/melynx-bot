import dedent from 'dedent';
import Sequelize, { Model } from 'sequelize';

import Help from './help';
import { Message } from 'discord.js';
import Command, { GuildConfig, PermissionLevel } from '../types/command';
import { MelynxClient } from '../types/melynxClient';

interface Tag extends Model {
  id: number;
  guildId: string;
  name: string;
  content: string;
}

let TagDb: Sequelize.ModelCtor<Tag>;

const help = {
  name: 'tag',
  description: 'Get or create tags',
  usage: `\n${dedent(`
  {prefix} tag [tagname] (Gets a tag matching this name)
  {prefix} tag list (Shows a list of all available tags)
  {prefix} tag add [tagname] (Creates or edits a new tag)
  {prefix} tag remove [tagname] (Removes an existing tag)`)}`,
};

async function deleteTag(
  message: Message,
  conf: GuildConfig,
  params: string[],
  client: MelynxClient
) {
  if (params.length < 2) {
    await message.channel.send('Invalid amount of parameters provided, nya!');
    return;
  }

  if (message.author.id !== client.options.ownerId) {
    if (
      !message.member.roles.cache.filter(
        (r) => r.name === conf.modRole || r.name === conf.adminRole
      ).size
    ) {
      return;
    }
  }

  const tagName = params[1];
  const tag = await TagDb.findOne({ where: { guildId: message.guild.id, name: tagName } });

  if (!tag) {
    await message.channel.send(`Tag \`${tagName}\` doesn't exist!`);
  } else {
    await tag.destroy();
    await message.channel.send(`Deleted tag \`${tagName}\`.`);
  }
}

async function addTag(message: Message, conf: GuildConfig, params: string[], client: MelynxClient) {
  if (params.length < 2) {
    await message.channel.send('Invalid amount of parameters provided, nya!');
    return;
  }

  if (message.author.id !== client.options.ownerId) {
    if (
      !message.member.roles.cache.filter(
        (r) => r.name === conf.modRole || r.name === conf.adminRole
      ).size
    ) {
      return;
    }
  }

  const tagName = params[1];

  if (tagName === 'list' || tagName === 'add' || tagName === 'remove') {
    await message.channel.send(`Can't create a tag called ${tagName}.`);
  }

  const content = params.slice(2).join(' ');
  const tag = await TagDb.findOne({ where: { guildId: message.guild.id, name: tagName } });

  if (!tag) {
    await TagDb.create({ guildId: message.guild.id, name: tagName, content });
    await message.channel.send(`Created tag \`${tagName}\`.`);
  } else {
    await tag.update({ content });
    await message.channel.send(`Updated tag \`${tagName}\`.`);
  }
}

async function getTag(message: Message, params: string[]) {
  const tag = await TagDb.findOne({
    where: {
      guildId: message.guild.id,
      $col: Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), params[0].toLowerCase()),
    },
    raw: true,
  });

  if (!tag) {
    await message.channel.send(`Could not find a tag called ${params[0]}, nya!`);
    return;
  }

  await message.channel.send(`>>> ${tag.content}`);
}

async function listTags(message: Message) {
  const tags = await TagDb.findAll({
    where: { guildId: message.guild.id },
  });

  await message.channel.send(`
    List of tags: \`\`\`${tags.map((tag) => tag.name).join(', ')}\`\`\``);
}

export default {
  config: {
    enabled: true,
    aliases: ['t', 'tags'],
    permissionLevel: PermissionLevel.Anyone,
    guildOnly: true,
    ownerOnly: false,
  },

  help,

  init: async (client) => {
    const { db } = client;

    TagDb = db.define(
      'tag',
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        guildId: { type: Sequelize.STRING, allowNull: false },
        name: { type: Sequelize.STRING, allowNull: false },
        content: { type: Sequelize.STRING, allowNull: false },
      },
      { createdAt: 'date' }
    );

    await TagDb.sync();
  },

  run: async (client, message, conf, params) => {
    if (!params.length) {
      Help.run(client, message, conf, [help.name]);
      return;
    }

    switch (params[0].toLowerCase()) {
      case 'list':
        await listTags(message);
        break;
      case 'add':
        await addTag(message, conf, params, client);
        break;
      case 'remove':
        await deleteTag(message, conf, params, client);
        break;
      default:
        await getTag(message, params);
        break;
    }
  },
} as Command;
