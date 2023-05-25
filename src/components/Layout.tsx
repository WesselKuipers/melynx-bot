import { AppShell, Header, useMantineTheme, Group, Button } from '@mantine/core';
import { signIn, useSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { BiHomeHeart, BiSticker } from 'react-icons/bi';
import { BsDiscord } from 'react-icons/bs';
import AvatarMenu from './AvatarMenu';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const theme = useMantineTheme();
  const router = useRouter();
  const session = useSession();

  return (
    <main>
      <Head>
        <title>Melynx Bot</title>
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <AppShell
        styles={{
          main: {
            background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
          },
        }}
        header={
          <Header height={70} p="md">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '100%',
              }}
            >
              <Group>
                <Link href="/" passHref>
                  <a style={{ display: 'flex' }}>
                    <Image src="/images/logo.png" width="64" height="42" alt="Logo" />
                  </a>
                </Link>
                <Link href="/" passHref>
                  <Button
                    variant={
                      router.pathname === '/' || router.pathname === '/dashboard'
                        ? 'filled'
                        : 'subtle'
                    }
                    component="a"
                    leftIcon={<BiHomeHeart />}
                  >
                    Home
                  </Button>
                </Link>
                <Link href="/stickers" passHref>
                  <Button
                    variant={router.pathname === '/stickers' ? 'filled' : 'subtle'}
                    component="a"
                    leftIcon={<BiSticker />}
                  >
                    Stickers
                  </Button>
                </Link>
              </Group>
              {session.status === 'authenticated' ? (
                <div>
                  <AvatarMenu />
                </div>
              ) : (
                <Button
                  color="violet"
                  variant="light"
                  onClick={() => signIn('discord')}
                  leftIcon={<BsDiscord />}
                >
                  Login with Discord
                </Button>
              )}
            </div>
          </Header>
        }
      >
        {children}
      </AppShell>
    </main>
  );
}
