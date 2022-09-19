import {
  Card,
  Center,
  TextInput,
  Text,
  SimpleGrid,
  Space,
  CopyButton,
  Tooltip,
} from '@mantine/core';
import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { HiOutlineCheckCircle } from 'react-icons/hi';
import { readdirSync } from 'fs';
import { join } from 'path';
import Image from 'next/future/image';
import sizeOf from 'image-size';
import Head from 'next/head';

interface Props {
  stickers: {
    name: string;
    width: number;
    height: number;
  }[];
}

export default function Stickers({ stickers }: Props) {
  const [filter, setFilter] = useState('');

  return (
    <>
      <Head>
        <title>Melynx Bot | Stickers</title>
      </Head>
      <Center>
        <TextInput
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value.toLocaleLowerCase())}
          placeholder="Your favourite sticker"
          icon={<FaSearch />}
        />
      </Center>
      <Space h="md" />
      <SimpleGrid
        breakpoints={[
          { minWidth: 'sm', cols: 2 },
          { minWidth: 'md', cols: 3 },
          { minWidth: 1200, cols: 4 },
        ]}
      >
        {stickers
          .filter((sticker) => sticker.name.includes(filter))
          .map((sticker) => (
            <CopyButton
              timeout={2000}
              key={sticker.name}
              value={`/sticker ${sticker.name.split('.')[0]}`}
            >
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
                  <Card
                    component="a"
                    key={sticker.name}
                    shadow="sm"
                    p="xs"
                    radius="md"
                    withBorder
                    onClick={copy}
                    style={{
                      cursor: 'pointer',
                    }}
                  >
                    <Card.Section>
                      <Center>
                        <Image
                          src={`/images/stickers/${sticker.name}`}
                          width={sticker.width}
                          height={sticker.height}
                          style={{ maxHeight: '215px', maxWidth: '300px', objectFit: 'contain' }}
                          alt={`${sticker.name} sticker`}
                        />
                      </Center>
                    </Card.Section>
                    <Text style={{ height: '100%' }} align="center" color="dimmed">
                      {sticker.name.split('.')[0]}
                    </Text>
                  </Card>
                </Tooltip>
              )}
            </CopyButton>
          ))}
      </SimpleGrid>
    </>
  );
}

export async function getStaticProps() {
  const basePath = join(process.cwd(), 'public', 'images', 'stickers');
  const stickers = readdirSync(basePath);

  return {
    props: {
      stickers: stickers.map((name) => {
        const { width, height } = sizeOf(join(basePath, name));
        return { name: name.toLocaleLowerCase(), width, height };
      }),
    },
  };
}
