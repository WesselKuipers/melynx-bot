import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import env from '../../../server/env';

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: env.CLIENT_ID,
      clientSecret: env.CLIENT_SECRET,
    }),
  ],
};

export default NextAuth(authOptions);
