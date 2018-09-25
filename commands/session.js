import moment from 'moment';

const pc = /\b3pseat[a-zA-Z0-9]{5}\b/;
const ps4 = /\b[a-zA-Z0-9]{12}\b/;
const sw = /\b\d{2}-\d{4}-\d{4}-\d{4}\b/;

let sessions = [];
let counter = 0;

export default class Session {
  constructor() {
    this.config = {
      enabled: true,
      aliases: ['ses', 's', 'sessions'],
      permissionLevel: 0,
      guildOnly: true,
      cooldown: 5,
    };

    this.help = {
      name: 'session',
      description: 'Lists all current sessions or adds one. Sessions expire after 8 hours.',
      usage: 'session | session [session id] [description] | session [remove|r] [session id]',
    };
  }

  async listSessions(conf, channel) {
    const sessionMessage = [];
    const { prefix } = conf;
      
    sessions.filter(s => s.guildId === channel.guild.id).map(s => {
      sessionMessage.push(`(${Math.floor(moment.duration(moment().diff(s.date)).asMinutes())}m ago by ${s.creator}) [${s.platform}]: ${s.sessionId}${s.description}`);
    });

    if (!sessionMessage.length) {
      sessionMessage.push('There are no active sessions! Feel free to create one yourself! ' + prefix);
    }

    channel.send(sessionMessage, { split: true });
  }

  removeSession(id) {
    sessions = sessions.filter(item => item.id !== id);
  }

  async handleExpiredSession(client, message, prefix, sessionTimeout, session) {
    const expireMessage = `Session ${session.sessionId} expired!`;
    this.removeSession(session.id);
    clearTimeout(session.timer);
    client.log(expireMessage);
    
    const sentMessage = await message.channel.send(`${expireMessage} React within 5 minutes ♻ to refresh this session!`);
    const reaction = await sentMessage.react('♻');
    
    sentMessage.awaitReactions((reaction) => reaction.emoji.name === '♻', { max: 2, time: 5 * 60 * 1000, error: ['time'] })
      .then(async () => {
        const refreshMessage = `Refreshed session ${session.sessionId}! ${prefix}`;
        message.channel.send(refreshMessage);

        const timer = setTimeout(() => this.handleExpiredSession(client, message, prefix, sessionTimeout, session), sessionTimeout);
        session.timer = timer;

        if (sessions.some(s => s.sessionId === session.sessionId)) {
          return;
        }

        sessions.push(session);
        counter++;

        client.log(refreshMessage);
      })
      .catch(async () => {
        await sentMessage.edit(expireMessage);
        await reaction.remove();
      });
  }

  init(client) {
    client.defaultSettings.sessionTimeout = 28800000; // 8 hours
  }

  run(client, message, conf, params) {
    if (!params.length) {
      this.listSessions(conf, message.channel);
      return;
    }

    const joinedParams = params.join(' ');
    const foundPC = pc.exec(joinedParams);
    const foundPS4 = ps4.exec(joinedParams);
    const foundSwitch = sw.exec(joinedParams);
    
    const { prefix, sessionTimeout } = conf;

    if (params[0] === 'r' || params[0] === 'remove') {
      const sessionId = params[1];
      const session = sessions.find(ses => ses.sessionId === sessionId);

      if (!session || session.guildId !== message.guild.id) {
        message.channel.send('A session with that ID does not exist, nya...');
        return;
      }

      this.removeSession(session.id);
      clearTimeout(session.timer);
      message.channel.send(`Remeowved session ${session.sessionId}! ${prefix}`);
      return;
    }

    if (!foundPC && !foundPS4 && !foundSwitch) {
      message.channel.send('Couldn\'t find any sessions, nya...');
      return;
    }

    let session = {
      id: counter,
      creator: message.author.username,
      date: moment(),
      guildId: message.guild.id,
    };

    if (foundPC) {
      session.sessionId = foundPC[0];
      session.description = foundPC.input.slice(foundPC[0].length + foundPC.index);
      session.platform = 'PC';
    }

    if (foundSwitch) {
      session.sessionId = foundSwitch[0];
      session.description = foundSwitch.input.slice(foundSwitch[0].length + foundSwitch.index);
      session.platform = 'Switch';
    }

    if (foundPS4 && !foundPC) {
      session.sessionId = foundPS4[0];
      session.description = foundPS4.input.slice(foundPS4[0].length + foundPS4.index);
      session.platform = 'PS4';
    }

    if (sessions.some(s => s.sessionId === session.sessionId && s.guildId === message.guild.id)) {
      message.channel.send('A lobby with this ID already exists!');
      return;
    }

    message.channel.send(`Added ${session.platform} session ${session.sessionId}! ${prefix}`);

    const timer = setTimeout(() => this.handleExpiredSession(client, message, prefix, sessionTimeout, session), sessionTimeout); // auto clear after (default) 8 hours
    session.timer = timer;

    // see: http://www.asciitable.com/
    session.description = session.description.replace(/[^\x20-\x9A]|[<@>]/g, '').slice(0, 100);

    sessions.push(session);

    counter++;
  }
}
