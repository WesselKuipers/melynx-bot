import { Avatar, Group, Menu, UnstyledButton } from '@mantine/core';
import { DefaultSession } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface AvatarButtonProps extends ComponentPropsWithoutRef<'button'> {
  user: DefaultSession['user'];
}

const AvatarButton = forwardRef<HTMLButtonElement, AvatarButtonProps>(({ user, ...props }, ref) => (
  <UnstyledButton
    ref={ref}
    style={{
      display: 'block',
    }}
    {...props}
  >
    <Group>
      <Avatar src={user?.image} alt={user?.name ?? ''} />
      <FaChevronDown />
    </Group>
  </UnstyledButton>
));
AvatarButton.displayName = 'AvatarButton';

export default function AvatarLayout() {
  const session = useSession();

  if (session.status !== 'authenticated') {
    return null;
  }

  return (
    <Menu withArrow>
      <Menu.Target>
        <AvatarButton user={session.data.user} />
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => signOut({ redirect: false })}>Sign out</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
