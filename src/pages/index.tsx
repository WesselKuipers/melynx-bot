import type { NextPage } from 'next';
import Head from 'next/head';
import { Container } from '@mantine/core';
import LoginInstruction from '../components/LoginInstruction';

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
