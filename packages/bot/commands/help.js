export default class Help {
  constructor() {
    this.config = {
      enabled: true,
      aliases: ['h', 'commands'],
      permissionLevel: 0,
      guildOnly: false,
      cooldown: 5,
    };

    this.help = {
      name: 'help',
      description: 'List all of my commands or info about a specific command.',
      usage: '{prefix} help [command name]',
    };
  }

  run(client, message, conf, params) {
    if (!params.length) {
      const commands = [
        ...client.commands.filter(command => !command.config.ownerOnly).keys(),
      ];
      message.channel.send(
        `Available commands: \`${commands.join(
          '`, `'
        )}\`\nType ${this.help.usage.replace(
          /{prefix}/g,
          conf.prefix
        )} for more info!`
      );
      return;
    }

    const commandName = params[0];
    const command =
      client.commands.get(commandName) || client.aliases.get(commandName);

    if (!command || command.ownerOnly) {
      message.channel.send(`Command ${commandName} does not exist, nya!`);
    }

    const data = [];
    data.push(`**Name:** ${command.help.name}`);

    if (command.config.aliases) {
      data.push(`**Aliases:** ${command.config.aliases.join(', ')}`);
    }

    data.push(`**Description:** ${command.help.description}`);
    data.push(
      `**Usage:** ${command.help.usage.replace(/{prefix}/g, conf.prefix)}`
    );

    message.channel.send(data, { split: true });
  }
}
