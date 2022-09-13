import Image from 'next/image';
import { Text, Center, Stack } from '@mantine/core';
import { ReactElement, useState } from 'react';
import styles from './index.module.css';

export default function LoginInstruction(): ReactElement {
  const [garuga] = useState(Math.round(Math.random()));

  return (
    <Center>
      <Stack align="center">
        <Image
          className={styles.wiggle}
          width={128}
          height={128}
          alt="Idiot bird"
          src={garuga ? '/images/garuga.png' : '/images/kutku.png'}
        />
        <Text>Please log in with your Discord account to view the list of sessions!</Text>
      </Stack>
    </Center>
  );
}
