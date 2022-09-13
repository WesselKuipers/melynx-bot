import NextApp, { type AppContext, type AppProps } from 'next/app';
import Layout from '../components/Layout';
import { ColorScheme, ColorSchemeProvider, MantineProvider } from '@mantine/core';
import { cssCache } from '../server/emotionCache';
import { useState } from 'react';
import { getCookie, setCookie } from 'cookies-next';
import { getSession, SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { colors } from '../styles/theme';
export default function App({
  Component,
  pageProps: { session, ...pageProps },
  colorScheme: initialColorScheme,
}: AppProps & { session: Session; colorScheme: ColorScheme }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(initialColorScheme);
  const toggleColorScheme = (value?: ColorScheme) => {
    const nextColorScheme = value || (colorScheme === 'dark' ? 'light' : 'dark');
    setColorScheme(nextColorScheme);
    // when color scheme is updated save it to cookie
    setCookie('mantine-color-scheme', nextColorScheme, { maxAge: 60 * 60 * 24 * 30 });
  };

  return (
    <SessionProvider session={session}>
      <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
        <MantineProvider
          theme={{
            colorScheme,
            colors,
          }}
          withGlobalStyles
          withNormalizeCSS
          emotionCache={cssCache}
        >
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </MantineProvider>
      </ColorSchemeProvider>
    </SessionProvider>
  );
}

App.getInitialProps = async (context: AppContext) => {
  const appProps = await NextApp.getInitialProps(context);
  const session = await getSession(context.ctx);

  return {
    ...appProps,
    session,
    colorScheme: getCookie('mantine-color-scheme', context.ctx) || 'dark',
  };
};
