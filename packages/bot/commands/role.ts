import Sequelize, { Model } from 'sequelize';

import Help from './help';
import { Message } from 'discord.js';
import Command, { GuildConfig, PermissionLevel } from '../types/command';
import { MelynxClient } from '../types/melynxClient';

interface Role extends Model {
  id: string;
  guildId: string;
  name: string;
}

let RoleDb: Sequelize.ModelCtor<Role>;

const help = {
  name: 'role',
  description: 'Allows you to join or leave mentionable roles.',
  usage:
    '{prefix} role [role] (Joins or leaves a role)\n{prefix} role list (Lists all joinable roles)',
};

async function removeRole(
  message: Message,
  conf: GuildConfig,
  params: string[],
  client: MelynxClient
) {
  if (params.length < 2) {
    message.channel.send('Invalid amount of parameters provided, nya!');
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

  const roleName = params.splice(1).join(' ');
  const result = await RoleDb.destroy({
    where: {
      name: Sequelize.where(
        Sequelize.fn('lower', Sequelize.col('name')),
        Sequelize.fn('lower', roleName)
      ),
    },
  });

  if (result) {
    message.channel.send(`Removed role ${roleName}`);
  } else {
    message.channel.send(`Could not find role ${roleName}`);
  }
}

async function handleRoleJoin(message: Message, params: string[]) {
  const roleName = params.join(' ');
  const role = await RoleDb.findOne({
    where: {
      name: Sequelize.where(
        Sequelize.fn('lower', Sequelize.col('name')),
        Sequelize.fn('lower', roleName)
      ),
    },
  });

  if (!role) {
    await message.channel.send(`Could not find a joinable role called ${roleName}`);
    return;
  }

  if (message.member.roles.cache.has(role.id)) {
    await message.member.roles.remove(role.id);
    await message.reply(`remeowved role ${role.name}, nya!`);
  } else {
    await message.member.roles.add(role.id);
    await message.reply(`added role ${role.name}, meow!`);
  }
}

async function addRole(
  message: Message,
  conf: GuildConfig,
  params: string[],
  client: MelynxClient
) {
  if (params.length !== 2) {
    message.channel.send('Invalid amount of parameters provided, nya!');
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

  const roleName = params.splice(1).join(' ');
  const role = message.guild.roles.cache
    .filter((r) => r.name.toLowerCase() === roleName.toLowerCase())
    .first();

  if (!role) {
    message.channel.send(`Role ${roleName} doesn't exist!`);
    return;
  }

  if (!role.editable) {
    message.channel.send("I'm not allowed to assign this role!");
    return;
  }

  const result = await RoleDb.findCreateFind({
    where: { id: role.id, name: role.name, guildId: message.guild.id },
  });
  if (!result[1]) {
    message.channel.send(`Role ${role.name} already exists`);
  } else {
    message.channel.send(`Added role ${role.name}`);
  }
}

async function listRoles(message: Message) {
  const roles = await RoleDb.findAll({
    where: { guildId: message.guild.id },
  });

  await message.channel.send(
    `List of joinable roles: \`\`\`${
      roles.length ? roles.map((role) => `${role.name}`).join(', ') : '(none)'
    }\`\`\``
  );
}

export default {
  config: {
    enabled: true,
    aliases: ['r', 'rank'],
    permissionLevel: PermissionLevel.Anyone,
    guildOnly: true,
    ownerOnly: false,
  },

  help,

  init: async (client) => {
    const { db } = client;

    RoleDb = db.define<Role>(
      'role',
      {
        id: { type: Sequelize.STRING, primaryKey: true },
        guildId: { type: Sequelize.STRING, allowNull: false },
        name: { type: Sequelize.STRING, allowNull: false },
      },
      { createdAt: 'date' }
    );

    await RoleDb.sync();
  },

  run: async (client, message, conf, params) => {
    if (!params.length) {
      await Help.run(client, message, conf, [help.name]);
      return;
    }

    switch (params[0].toLowerCase()) {
      case 'list':
        await listRoles(message);
        break;
      case 'add':
        await addRole(message, conf, params, client);
        break;
      case 'remove':
        await removeRole(message, conf, params, client);
        break;
      default:
        await handleRoleJoin(message, params);
        break;
    }
  },
} as Command;
