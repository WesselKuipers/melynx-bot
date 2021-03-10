import dedent from 'dedent';
import { Argument, Flag } from 'discord-akairo';
import { Role } from 'discord.js';
import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../../types/melynxClient';
import { generateHelp } from '../help';

export default class Tag extends MelynxCommand {
  constructor() {
    super('role', {
      aliases: ['role', 'rank'],
      description: 'Assign roles to yourself',
      clientPermissions: ['MANAGE_ROLES'],
      channel: 'guild',
    });

    this.usage = `\n${dedent(`
    {prefix} role [role] (Join or remove a role)
    {prefix} role list (Shows a list of all available roles)
    {prefix} role add [role] (Add a new self-assignable role)
    {prefix} role remove [role] (Removes an existing self-assignable role)`)}`;
  }

  *args(message: MelynxMessage) {
    const name = yield {
      type: Argument.union(
        [
          ['role-list', 'list', 'l'],
          ['role-add', 'add', 'a'],
          ['role-remove', 'remove', 'r', 'delete', 'd'],
        ],
        'string'
      ),
      otherwise: generateHelp(message, 'role'),
    };

    if (!['role-list', 'role-add', 'role-remove'].includes(name)) {
      return { role: message.client.util.resolveRole(name, message.guild.roles.cache, false) };
    }

    return Flag.continue(name);
  }

  public async exec(message: MelynxMessage, { role }: { role: Role }): Promise<Message> {
    if (!role) {
      return message.util.send(`Could not find a role that matches this name.`);
    }

    if (!role.editable) {
      return message.util.send("I'm not allowed to assign this role.");
    }

    const roleDb = message.client.models.role;
    const entry = await roleDb.findOne({
      where: {
        id: role.id,
      },
    });

    if (!entry) {
      return message.util.send(`This role is not self-assignyable.`);
    }

    if (message.member.roles.cache.has(role.id)) {
      await message.member.roles.remove(role.id);
      return message.util.reply(`remeowved role ${role.name}, nya!`);
    } else {
      await message.member.roles.add(role.id);
      return message.util.reply(`added role ${role.name}, meow!`);
    }
  }
}
