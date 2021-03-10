import axios from 'axios';
import { Message } from 'discord.js';
import { MelynxCommand, MelynxMessage } from '../types/melynxClient';

export default class CatFact extends MelynxCommand {
  constructor() {
    super('catfact', {
      aliases: ['catfact'],
      description: 'Fetches a random cat fact!',
    });

    this.usage = '{prefix} catfact';
  }

  public async exec(message: MelynxMessage): Promise<Message> {
    const { data } = await axios.get<{ text: string; _id: string }>(
      'https://cat-fact.herokuapp.com/facts/random'
    );

    return message.util.send({
      embed: {
        description: `[${data.text}](https://cat-fact.herokuapp.com/#/cat/facts/${data._id})`,
      },
    });
  }
}
