import Sequelize from 'sequelize';

import Help from './help';

/** @type {Sequelize.Model} */
let RoleDb;

export default class Role {
  constructor() {
    this.config = {
      enabled: true,
      aliases: ['r', 'rank'],
      permissionLevel: 0,
      guildOnly: true,
      cooldown: 5,
    };

    this.help = {
      name: 'role',
      description: 'Allows you to join or leave mentionable roles.',
      usage:
        '{prefix} role [role] (Joins or leaves a role)\n{prefix} role list (Lists all joinable roles)',
    };

    this.init = async (client) => {
      client.defaultSettings.sessionTimeout = 28800000; // 8 hours
      client.defaultSettings.sessionRefreshTimeout = 5 * 60 * 1000; // 5 minutes

      /** @type {Sequelize.Sequelize} */
      const { db } = client;

      RoleDb = db.define(
        'role',
        {
          id: { type: Sequelize.STRING, primaryKey: true },
          guildId: { type: Sequelize.STRING, notNull: true },
          name: { type: Sequelize.STRING, notNull: true },
        },
        { createdAt: 'date' }
      );

      await RoleDb.sync();
    };

    this.listRoles = async (message) => {
      const roles = await RoleDb.findAll({
        where: { guildId: message.guild.id },
      });
      message.channel.send(
        `List of joinable roles: \`\`\`${
          roles.length ? roles.map((role) => `${role.name}`).join(', ') : '(none)'
        }\`\`\``
      );
    };

    /**
     * @param {Discord.Message} message
     */
    this.addRole = async (message, conf, params, client) => {
      if (params.length !== 2) {
        message.channel.send('Invalid amount of parameters provided, nya!');
        return;
      }

      if (message.author.id !== client.options.ownerId) {
        if (
          !message.member.roles.cache.filter(
            (r) => r.name === conf.modRole || r.name === conf.adminRole
          ).length
        ) {
          return;
        }
      }

      const roleName = params.splice(1).join(' ');
      const role = message.guild.roles
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
    };

    /**
     * @param {Discord.Message} message
     */
    this.removeRole = async (message, conf, params, client) => {
      if (params.length < 2) {
        message.channel.send('Invalid amount of parameters provided, nya!');
        return;
      }

      if (message.author.id !== client.options.ownerId) {
        if (
          !message.member.roles.cache.filter(
            (r) => r.name === conf.modRole || r.name === conf.adminRole
          ).length
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
    };

    /**
     * @param {Discord.Message} message
     */
    this.handleRoleJoin = async (message, params) => {
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
        message.channel.send(`Could not find a joinable role called ${roleName}`);
        return;
      }

      if (message.member.roles.cache.has(role.id)) {
        message.member.roles.remove(role.id);
        message.reply(`remeowved role ${role.name}, nya!`);
      } else {
        message.member.roles.add(role.id);
        message.reply(`added role ${role.name}, meow!`);
      }
    };
    /**
     * @param {Discord.Client} client
     * @param {Discord.Message} message
     * @param {Object} conf
     * @param {String[]} params
     */
    this.run = async (client, message, conf, params) => {
      if (!params.length) {
        new Help().run(client, message, conf, [this.help.name]);
        return;
      }

      switch (params[0].toLowerCase()) {
        case 'list':
          await this.listRoles(message, conf);
          break;
        case 'add':
          await this.addRole(message, conf, params, client);
          break;
        case 'remove':
          await this.removeRole(message, conf, params, client);
          break;
        default:
          this.handleRoleJoin(message, params);
          break;
      }
    };
  }
}
