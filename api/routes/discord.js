import btoa from 'btoa';
import axios from 'axios';

const getRedirect = options =>
  encodeURIComponent(
    `${options.protocol}://${options.host}/api/discord/callback`
  );

function login(options) {
  const redirect = getRedirect(options);

  return (req, res) => {
    res.redirect(
      `https://discordapp.com/api/oauth2/authorize?client_id=${options.clientId}&scope=identify guilds&response_type=code&redirect_uri=${redirect}`
    );
  };
}

function callback(options) {
  const redirect = getRedirect(options);

  return async (req, res) => {
    if (!req.query.code) throw new Error('NoCodeProvided');
    const { code } = req.query;
    const creds = btoa(`${options.clientId}:${options.clientSecret}`);
    try {
      const {
        data: { access_token: token, refresh_token: refreshToken },
      } = await axios({
        url: `https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect}`,
        method: 'POST',
        headers: {
          Authorization: `Basic ${creds}`,
        },
      });
      res.redirect(`/?token=${token}&refreshToken=${refreshToken}`);
    } catch (e) {
      this.error(e);
    }
  };
}

export default (router, { options }) => {
  router.get('/discord/login', login(options));
  router.get('/discord/callback', callback(options));
};
