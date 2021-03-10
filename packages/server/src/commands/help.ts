import { MessageEmbed } from 'discord.js';
import { Message } from 'discord.js';
import { getGuildSettings } from '../bot/utils';
import { MelynxCommand, MelynxMessage } from '../types/melynxClient';

export async function generateHelp(message: MelynxMessage, command: string): Promise<MessageEmbed> {
  const com = message.client.commandHandler.findCommand(command) as MelynxCommand;
  if (!com || !com.aliases.length) {
    return;
  }

  const prefix = message.guild
    ? (await getGuildSettings(message.client, message.guild.id)).prefix
    : message.client.defaultSettings.prefix;

  const embed = new MessageEmbed({ title: com.id, description: com.description });
  const aliases = com.aliases.filter((a) => a !== com.id);

  if (aliases.length) {
    embed.addField('Aliases', `\`${aliases.join('`, ')}\``);
  }

  if (com.usage) {
    embed.addField('Usage', com.usage.replace(/{prefix}/g, prefix));
  }

  return embed;
}

export default class Help extends MelynxCommand {
  constructor() {
    super('help', {
      aliases: ['help', 'h'],
      description: 'List all of my commands or info about a specific command.',
      args: [{ id: 'command', description: 'The command to display the help message of' }],
    });

    this.usage = '{prefix}help [command name]';
  }

  public async exec(message: MelynxMessage, { command }: { command: string }): Promise<Message> {
    const prefix = message.guild
      ? (await getGuildSettings(message.client, message.guild.id)).prefix
      : message.client.defaultSettings.prefix;
    if (!command) {
      const commands = [...message.client.commandHandler.modules.values()].filter(
        // Filter out owner-only messages.
        // No aliases means that the command should not be called directly. It's probably a subcommand.
        (c) => !c.ownerOnly && c.aliases.length
      ) as MelynxCommand[];
      return message.util.send(
        `Available commands: \`${commands.join('`, `')}\`\nType \`${this.usage.replace(
          /{prefix}/g,
          prefix
        )}\` for more info!`
      );
    }

    const com = message.client.commandHandler.findCommand(command) as MelynxCommand;
    if (!com || com.ownerOnly) {
      return message.util.send(`Command ${command} does not exist, nya!`);
    }

    const embed = await generateHelp(message, com.id);

    return message.util.send({ embed });
  }
}
