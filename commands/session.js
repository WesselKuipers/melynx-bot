import moment from 'moment';
const prefix = process.env.PREFIX;

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
      description: 'Lists all current sessions or adds one. Sessions expire after 4 hours.',
      usage: 'session | session [session id] [description]',
    };
  }

  listSessions(channel) {
    const sessionMessage = [];
      
    sessions.map(s => {
      sessionMessage.push(`(${Math.floor(moment.duration(moment().diff(s.date)).asMinutes())}m ago by ${s.creator}) [${s.platform}]: ${s.sessionId}${s.description}`);
    });

    if (!sessionMessage.length) {
      sessionMessage.push('There are no active sessions! Feel free to create one yourself! ' + prefix);
    }

    channel.send(sessionMessage, { split: true });
  }

  run(client, message, params) {
    if (!params.length) {
      this.listSessions(message.channel);
      return;
    }

    const joinedParams = params.join(' ');
    const foundPC = pc.exec(joinedParams);
    const foundPS4 = ps4.exec(joinedParams);
    const foundSwitch = sw.exec(joinedParams);

    if (!foundPC && !foundPS4 && !foundSwitch) {
      message.channel.send('Couldn\'t find any sessions, nya...');
      return;
    }

    let session = {
      id: counter,
      creator: message.author.username,
      date: moment(),
    };

    if (foundPC) {
      session.sessionId = foundPC[0];
      session.description = foundPC.input.slice(foundPC[0].length + foundPC.index);
      session.platform = 'PC';
      
      if (sessions.some(s => s.sessionId === session.sessionId)) {
        message.channel.send('A lobby with this ID already exists!');
        return;
      }

      message.channel.send(`Added PC session ${session.sessionId}! ${prefix}`);

      sessions.push(session);

      setTimeout(() => {
        sessions = sessions.filter(item => item.id !== session.id);
      }, 14400000); // auto clear after 4 hours

      counter++;
      return;
    }

    if (foundSwitch) {
      session.sessionId = foundSwitch[0];
      session.description = foundSwitch.input.slice(foundSwitch[0].length + foundSwitch.index);
      session.platform = 'Switch';

      if (sessions.some(s => s.sessionId === session.sessionId)) {
        message.channel.send('A lobby with this ID already exists!');
        return;
      }

      message.channel.send(`Added Switch session ${session.sessionId}! ${prefix}`);

      sessions.push(session);

      setTimeout(() => {
        sessions = sessions.filter(item => item.id !== session.id);
      }, 14400000); // auto clear after 4 hours

      counter++;
      return;
    }

    if (foundPS4 && !foundPC) {
      session.sessionId = foundPS4[0];
      session.description = foundPS4.input.slice(foundPS4[0].length + foundPS4.index);
      session.platform = 'PS4';

      if (sessions.some(s => s.sessionId === session.sessionId)) {
        message.channel.send('A lobby with this ID already exists!');
        return;
      }

      message.channel.send(`Added PS4 session ${session.sessionId}! ${prefix}`);

      sessions.push(session);

      setTimeout(() => {
        sessions = sessions.filter(item => item.id !== session.id);
      }, 14400000); // auto clear after 4 hours

      counter++;
      return;
    }
  }
}
