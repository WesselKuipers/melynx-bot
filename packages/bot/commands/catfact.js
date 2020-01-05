import axios from 'axios';

export default class GetConf {
  constructor() {
    this.config = {
      enabled: true,
      permissionLevel: 0,
      aliases: ['cf'],
      guildOnly: true,
      ownerOnly: false,
      cooldown: 5,
    };

    this.help = {
      name: 'catfact',
      description: 'Fetches a random cat fact!',
      usage: '{prefix} catfact',
    };

    this.run = async (client, message) => {
      const { data } = await axios.get(
        'https://cat-fact.herokuapp.com/facts/random'
      );

      message.channel.send(`>>> ${data.text}`);
    };
  }
}
