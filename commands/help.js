export default class Help {
  constructor() {
    this.config = {
      enabled: true,
      aliases: ['h', 'commands'],
      permissionLevel: 0,
      guildOnly: true,
      cooldown: 5,
    };

    this.help = {
      name: 'help',
      description: 'List all of my commands or info about a specific command.',
      usage: 'help [command name]',
    };
  }

  run(client, message, params) {
    if (!params.length) {
      const commands = [...client.commands.keys()];
      message.channel.send(`Available commands: ${commands.join(', ')}`);
      return;
    }

    const commandName = params[0];
    const command = client.commands.get(commandName) || client.aliases.get(commandName);

    if (!command) {
      message.channel.send(`Command ${commandName} does not exist, nya!`);
    }

    let data = [];
    data.push(`Name: ${command.help.name}`);

    if (command.config.aliases) {
      data.push(`Aliases: ${command.config.aliases.join(', ')}`);
    }

    data.push(`Description: ${command.help.description}`);
    data.push(`Usage: ${command.help.usage}`);  
    
    message.channel.send(data, {split: true});
  }
}
