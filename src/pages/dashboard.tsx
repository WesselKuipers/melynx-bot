import { Button, Center, Container, Loader, Stack } from '@mantine/core';
import { GetServerSideProps } from 'next';
import { unstable_getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';
import { FaPlusCircle } from 'react-icons/fa';
import SessionCard from '../components/SessionCard';
import { trpc } from '../utils/trpc';
import CreateSessionModal from '../components/CreateSessionModal';
import { useToggle } from '@mantine/hooks';

export default function Dashboard() {
  const sessions = trpc.session.getSessions.useQuery();
  const [creating, setCreating] = useToggle();
  if (!sessions.data) {
    return (
      <Center>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <>
      <Container>
        <Center mb="lg">
          <Button onClick={() => setCreating(true)} leftIcon={<FaPlusCircle />}>
            Create new session
          </Button>
        </Center>
        <Stack>
          {sessions.data.map((session) => (
            <SessionCard session={session} key={session.id} onDelete={() => {}} onEdit={() => {}} />
          ))}
        </Stack>
      </Container>
      <CreateSessionModal opened={creating} onClose={() => setCreating(false)} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return { props: {} };
};
