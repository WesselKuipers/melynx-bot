import dedent from 'dedent';
import { Argument } from 'discord-akairo';
import { GuildMember } from 'discord.js';
import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../types/melynxClient';
import { generateHelp } from './help';

const fcRegex = /((SW[- ]?)?)(\d{4}[- ]?){2}\d{4}/i;
const removeOptions = ['remove', 'r', 'delete', 'd'];

export default class FC extends MelynxCommand {
  constructor() {
    super('fc', {
      aliases: ['fc', 'friend-code', 'friendcode'],
      description: 'Register and list your own or other people’s Nintendo Switch friend codes',
      channel: 'guild',
      args: [
        {
          id: 'argument',
          type: Argument.union('memberMention', removeOptions, fcRegex, 'string'),
          match: 'rest',
        },
      ],
    });

    this.usage = `\n${dedent(`
    {prefix}fc (List your FC)
    {prefix}fc @User (List the FC of another user)
    {prefix}fc SW-1234-1234-1234 (Register your FC)
    {prefix}fc remove (Removes your FC registration)`)}`;
  }

  public async exec(
    message: MelynxMessage,
    { argument }: { argument: GuildMember | string | { match: string[] } }
  ): Promise<Message> {
    if (!argument) {
      return this.handleList(message, message.member);
    }

    if (typeof argument === 'string') {
      if (removeOptions.includes(argument)) {
        return this.handleRemove(message);
      }

      return message.util.send(await generateHelp(message, 'fc'));
    }

    if ('match' in argument) {
      return this.handleAdd(message, argument.match[0]);
    }

    return this.handleList(message, argument);
  }

  async handleList(message: MelynxMessage, member: GuildMember): Promise<Message> {
    const fc = await message.client.models.friendCode.findByPk(member.id);

    if (member.id === message.author.id) {
      if (!fc) {
        return message.util.reply(`it looks like you haven’t set your friend code yet!`);
      }

      return message.util.reply(`your friend code is **${fc.fc}**`);
    }

    if (!fc) {
      return message.util.reply(`it looks like this user hasn’t set their friend code yet!`);
    }

    return message.util.reply(`<@${member.id}>’s friend code is **${fc.fc}**`);
  }

  async handleRemove(message: MelynxMessage): Promise<Message> {
    const fc = await message.client.models.friendCode.findByPk(message.author.id);

    if (!fc) {
      return message.util.reply(
        'looks like you didn’t have a friend code, so I’m just going to take a nap instead, nya!'
      );
    }

    await fc.destroy();
    return message.util.reply(`remeowved your friend code.`);
  }

  async handleAdd(message: MelynxMessage, code: string): Promise<Message> {
    const fc = code.replace(/\D/g, '');
    const normalizedFc = `SW-${fc.substr(0, 4)}-${fc.substr(4, 4)}-${fc.substr(8, 4)}`;

    const dbFC = await message.client.models.friendCode.findOne({ where: { fc: normalizedFc } });
    if (dbFC && dbFC.id !== message.author.id) {
      return message.util.reply(`this friend code is already registered to someone else.`);
    }

    const [, updated] = await message.client.models.friendCode.upsert({
      id: message.author.id,
      fc: normalizedFc,
    });
    return message.util.reply(
      `successfully ${updated ? 'updated' : 'registered'} your friend code!`
    );
  }
}
