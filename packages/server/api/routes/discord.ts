import axios from 'axios';
import btoa from 'btoa';
import qs from 'querystring';
import { Router, Request, Response } from 'express';
import { ApplicationSettings } from '../../server';

const getRedirect = (options: ApplicationSettings) =>
  `${options.protocol}://${options.host}/api/discord/callback`;

function login(options: ApplicationSettings) {
  const redirect = getRedirect(options);

  return (req: Request, res: Response) => {
    res.redirect(
      `https://discordapp.com/api/oauth2/authorize?client_id=${options.clientId}&scope=identify guilds&response_type=code&redirect_uri=${redirect}`
    );
  };
}

function callback(options: ApplicationSettings) {
  const redirect = getRedirect(options);

  return async (req: Request<{}, {}, {}, { code: string }>, res: Response) => {
    if (!req.query.code) {
      throw new Error('NoCodeProvided');
    }

    const { code } = req.query;
    const creds = btoa(`${options.clientId}:${options.clientSecret}`);
    try {
      const {
        data: { access_token: token, refresh_token: refreshToken },
      } = await axios.post(
        'https://discordapp.com/api/oauth2/token',
        qs.stringify({ code, grant_type: 'authorization_code', redirect_uri: redirect }),
        {
          headers: {
            Authorization: `Basic ${creds}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      res.redirect(`/?token=${token}&refreshToken=${refreshToken}`);
    } catch (e) {
      console.log(e.response.data);
    }
  };
}

export default (router: Router, { options }: { options: ApplicationSettings }) => {
  router.get('/discord/login', login(options));
  router.get('/discord/callback', callback(options));
};
