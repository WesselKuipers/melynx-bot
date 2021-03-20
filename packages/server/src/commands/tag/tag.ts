import dedent from 'dedent';
import { Argument, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../../types/melynxClient';

export default class Tag extends MelynxCommand {
  constructor() {
    super('tag', {
      aliases: ['tag', 't'],
      description: 'Get or create custom tags',
    });

    this.usage = `\n${dedent(`
    {prefix} tag [tagname] (Gets a tag matching this name)
    {prefix} tag list (Shows a list of all available tags)
    {prefix} tag add [tagname] (Creates or edits a new tag)
    {prefix} tag remove [tagname] (Removes an existing tag)`)}`;
  }

  *args() {
    const name: string = yield {
      type: Argument.union(
        [
          ['tag-list', 'list', 'l'],
          ['tag-add', 'add', 'a'],
          ['tag-remove', 'remove', 'r'],
        ],
        'string'
      ),
      prompt: {
        start: 'What is the name of the tag? Type `cancel` to stop.',
        timeout: 'Time ran out, command has been cancelled.',
        ended: 'Too many retries, command has been cancelled.',
        cancel: 'Command has been cancelled.',
        retries: 4,
        time: 30e3,
      },
    };

    if (!['tag-list', 'tag-add', 'tag-remove'].includes(name)) {
      return { name };
    }

    return Flag.continue(name);
  }

  public async exec(message: MelynxMessage, { name }: { name: string }): Promise<Message> {
    const tagDb = message.client.models.tag;
    const tag = await tagDb.findOne({ where: { guildId: message.guild.id, name } });

    if (!tag) {
      await message.channel.send(`Could not find a tag called ${name}, nya!`);
      return;
    }

    await message.channel.send(`>>> ${tag.content}`);
  }
}
