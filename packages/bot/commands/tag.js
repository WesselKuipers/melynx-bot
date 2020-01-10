import dedent from 'dedent';
import Sequelize from 'sequelize';

import Help from './help';

/** @type {Sequelize.Model} */
let TagDb;

export default class Ping {
  constructor() {
    this.config = {
      enabled: true,
      aliases: ['t', 'tags'],
      permissionLevel: 0,
      guildOnly: true,
      cooldown: 5,
    };

    this.help = {
      name: 'tag',
      description: 'Get or create tags',
      usage: `\n${dedent(`
      {prefix} tag [tagname] (Gets a tag matching this name)
      {prefix} tag list (Shows a list of all available tags)
      {prefix} tag add [tagname] (Creates or edits a new tag)
      {prefix} tag remove [tagname] (Removes an existing tag)`)}`,
    };

    this.init = async client => {
      /** @type {Sequelize.Sequelize} */
      const { db } = client;

      TagDb = db.define(
        'tag',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          guildId: { type: Sequelize.STRING, notNull: true },
          name: { type: Sequelize.STRING, notNull: true },
          content: { type: Sequelize.STRING, notNull: true },
        },
        { createdAt: 'date' }
      );

      await TagDb.sync();
    };

    this.listTags = async message => {
      const tags = (await TagDb.findAll({
        where: { guildId: message.guild.id },
      }));

      message.channel.send(`
      List of tags: \`\`\`${tags.map(tag => tag.name).join(', ')}\`\`\``);
    }

    this.getTag = async (message, params) => {
      const tag = await TagDb.findOne({ where: { guildId: message.guild.id, $col: Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), params[0].toLowerCase()) }, raw: true });

      if (!tag) {
        message.channel.send(`Could not find a tag called ${params[0]}, nya!`);
        return;
      }

      message.channel.send(`>>> ${tag.content}`);
    }

    this.addTag = async (message, conf, params, client) => {
      if (params.length < 2) {
        message.channel.send('Invalid amount of parameters provided, nya!');
        return;
      }

      if (message.author.id !== client.options.ownerId) {
        if (
          !message.member.roles.findAll(
            r => r.name === conf.modRole || r.name === conf.adminRole
          ).length
        ) {
          return;
        }
      }

      const tagName = params[1];

      if (tagName === 'list' || tagName === 'add' || tagName === 'remove') {
        message.channel.send(`Can't create a tag called ${tagName}.`);
      }

      const content = params.slice(2).join(' ');
      const tag = await TagDb.findOne({ where: { guildId: message.guild.id, name: tagName } });

      if (!tag) {
        await TagDb.create({ guildId: message.guild.id, name: tagName, content });
        message.channel.send(`Created tag \`${tagName}\`.`);
      } else {
        await tag.update({ content });
        message.channel.send(`Updated tag \`${tagName}\`.`);
      }
    }

    this.deleteTag = async (message, conf, params, client) => {
      if (params.length < 2) {
        message.channel.send('Invalid amount of parameters provided, nya!');
        return;
      }

      if (message.author.id !== client.options.ownerId) {
        if (
          !message.member.roles.findAll(
            r => r.name === conf.modRole || r.name === conf.adminRole
          ).length
        ) {
          return;
        }
      }

      const tagName = params[1];
      const tag = await TagDb.findOne({ where: { guildId: message.guild.id, name: tagName } });

      if (!tag) {
        message.channel.send(`Tag \`${tagName}\` doesn't exist!`);
      } else {
        await tag.destroy();
        message.channel.send(`Deleted tag \`${tagName}\`.`);
      }
    }

    this.run = async (client, message, conf, params) => {
      if (!params.length) {
        new Help().run(client, message, conf, [this.help.name]);
        return;
      }

      switch (params[0].toLowerCase()) {
        case 'list':
          await this.listTags(message, conf);
          break;
        case 'add':
          await this.addTag(message, conf, params, client);
          break;
        case 'remove':
          await this.deleteTag(message, conf, params, client);
          break;
        default:
          await this.getTag(message, params);
          break;
      }
    };
  }
}
