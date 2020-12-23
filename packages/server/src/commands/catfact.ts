import axios from 'axios';
import Command, { PermissionLevel } from '../types/command';

export default {
  config: {
    enabled: true,
    permissionLevel: PermissionLevel.Anyone,
    aliases: ['cf'],
    guildOnly: true,
    ownerOnly: false,
  },

  help: {
    name: 'catfact',
    description: 'Fetches a random cat fact!',
    usage: '{prefix} catfact',
  },

  run: async (_, message) => {
    const { data } = await axios.get<{ text: string }>(
      'https://cat-fact.herokuapp.com/facts/random'
    );
    await message.channel.send(`>>> ${data.text}`);
  },
} as Command;
