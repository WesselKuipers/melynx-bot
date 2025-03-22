import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { Container } from '@mantine/core';
import LoginInstruction from '../components/LoginInstructions';
import { getSession, useSession } from 'next-auth/react';
import { unstable_getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Melynx Bot | Home</title>
      </Head>
      <Container>
        <LoginInstruction />
      </Container>
    </div>
  );
};

export default Home;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(context.req, context.res, authOptions);

  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return { props: {} };
};
