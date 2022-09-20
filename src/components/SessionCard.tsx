import {
  Card,
  Group,
  Text,
  Avatar,
  Badge,
  Menu,
  ActionIcon,
  CopyButton,
  Tooltip,
  Center,
  Button,
  Modal,
  Stack,
} from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import { Session } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { FaEllipsisV, FaPencilAlt, FaTrashAlt, FaCopy } from 'react-icons/fa';
import { HiOutlineCheckCircle, HiX } from 'react-icons/hi';

function hoursAgo(date: Date): string {
  const now = Date.now();
  const relative = now - date.getTime();
  const minutesAgo = relative / 1000 / 60;
  const hoursAgo = Math.floor(minutesAgo / 60);

  if (hoursAgo >= 2) {
    return `${hoursAgo} ago`;
  }

  if (hoursAgo === 1) {
    return `${hoursAgo}h ${Math.floor(minutesAgo)}m ago`;
  }

  return `${Math.floor(minutesAgo)}m ago`;
}

export default function SessionCard({
  session,
  onDelete,
}: {
  session: Session;
  onDelete: (session: Session) => void;
  onEdit: (session: Session) => void;
}) {
  const user = useSession();
  const [deleting, toggleDeleting] = useToggle();
  const [editing, toggleEditing] = useToggle();

  return (
    <>
      <Card key={session.id} shadow="sm" radius="md" withBorder>
        <Card.Section withBorder inheritPadding py="xs">
          <Group style={{ width: '100%' }} noWrap>
            <Avatar radius={'lg'} src={session.avatar} alt={session.creator} />
            <Group noWrap>
              <Text weight={500}>{session.sessionId}</Text>
              <Badge>{session.platform}</Badge>
              <Badge title={session.updatedAt.toDateString()}>{hoursAgo(session.updatedAt)}</Badge>
            </Group>
            {user.data?.user.id === session.userId ? (
              <Menu withinPortal position="bottom-end" shadow="sm">
                <Menu.Target>
                  <ActionIcon style={{ marginLeft: 'auto' }}>
                    <FaEllipsisV size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item icon={<FaPencilAlt size={14} />} onClick={() => toggleEditing(true)}>
                    Update session
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    icon={<FaTrashAlt size={14} />}
                    color="red"
                    onClick={() => toggleDeleting(true)}
                  >
                    Delete session
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : null}
          </Group>
        </Card.Section>
        {session.description ? (
          <Card.Section inheritPadding py="lg">
            <Text>{session.description}</Text>
          </Card.Section>
        ) : null}
        <Card.Section withBorder py="4px">
          <CopyButton timeout={2000} value={session.sessionId}>
            {({ copied, copy }) => (
              <Tooltip
                label={
                  <Center>
                    <HiOutlineCheckCircle size={24} />
                    <Text ml="4px">Copied!</Text>
                  </Center>
                }
                opened={copied}
                withArrow
                color="mhGreen"
              >
                <Button
                  style={{ backgroundColor: 'transparent' }}
                  radius={0}
                  fullWidth
                  onClick={copy}
                  leftIcon={<FaCopy />}
                >
                  Copy session ID
                </Button>
              </Tooltip>
            )}
          </CopyButton>
        </Card.Section>
      </Card>
      <Modal withCloseButton={false} centered opened={deleting} onClose={toggleDeleting}>
        <Stack align="center">
          <Text>Are you sure you want to delete this session?</Text>
          <Group>
            <Button leftIcon={<FaTrashAlt />} color="red" onClick={() => onDelete(session)}>
              Delete
            </Button>
            <Button
              leftIcon={<HiX />}
              variant="outline"
              onClick={() => toggleDeleting(false)}
            >
              Nevermind!
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
