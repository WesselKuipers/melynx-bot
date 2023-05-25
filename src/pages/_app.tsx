import { type AppProps } from 'next/app';
import Layout from '../components/Layout';
import { MantineProvider } from '@mantine/core';
import { cssCache } from '../server/emotionCache';
import { SessionProvider } from 'next-auth/react';
import { colors } from '../styles/theme';
import { trpc } from '../utils/trpc';

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider>
      <MantineProvider
        theme={{
          colorScheme: 'dark',
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
    </SessionProvider>
  );
}

export default trpc.withTRPC(App);
