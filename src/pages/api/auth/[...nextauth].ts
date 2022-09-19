import NextAuth, { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import env from '../../../server/env';

export const authOptions: NextAuthOptions = {
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token!;
      }

      return token;
    },
    async session({ session, token, user }) {
      session.user.id = token.sub!;
      session.user.accessToken = token.accessToken;

      return session;
    },
  },
  providers: [
    DiscordProvider({
      clientId: env.CLIENT_ID,
      clientSecret: env.CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'identify guilds',
        },
      },
    }),
  ],
};

export default NextAuth(authOptions);
