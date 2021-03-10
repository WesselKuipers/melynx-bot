import axios from 'axios';
import { Message } from 'discord.js';
import { getGuildSettings } from '../bot/utils';
import { MelynxCommand, MelynxMessage } from '../types/melynxClient';

export default class GetConf extends MelynxCommand {
  constructor() {
    super('getconf', {
      aliases: ['getconf'],
      userPermissions: ['ADMINISTRATOR'],
      description: 'Get the config for this server.',
      channel: 'guild',
      editable: false,
    });

    this.usage = '{prefix}getconf';
  }

  public async exec(message: MelynxMessage): Promise<Message> {
    const config = await getGuildSettings(message.client, message.guild.id);
    return message.util.send(`\`\`\`${JSON.stringify(config, null, 2)}\`\`\``);
  }
}
