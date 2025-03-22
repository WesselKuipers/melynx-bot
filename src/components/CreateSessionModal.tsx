import {
  Box,
  Button,
  Center,
  Input,
  Modal,
  SegmentedControl,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Session } from '@prisma/client';
import { IconType } from 'react-icons';
import { FaPlaystation, FaSteam } from 'react-icons/fa';
import { SiNintendoswitch } from 'react-icons/si';

interface Props {
  opened: boolean;
  onClose: () => void;
}

type FormProps = Pick<Session, 'description' | 'platform' | 'sessionId'>;

function SegmentedControlLabel({ icon: Icon, label }: { icon: IconType; label: string }) {
  return (
    <Center>
      <Icon />
      <Box ml={10}>{label}</Box>
    </Center>
  );
}

export default function CreateSessionModal({ opened, onClose }: Props) {
  const form = useForm<FormProps>({
    initialValues: {
      description: '',
      platform: '',
      sessionId: '',
    },
    validate: {
      sessionId: (value) => value.length,
      platform: (value) => value.length,
    },
  });

  return (
    <Modal centered opened={opened} onClose={onClose} title="Creating a new session">
      <form
        onSubmit={form.onSubmit((values) => {
          console.log(values);
        })}
      >
        <Stack>
          <TextInput label="Session ID" withAsterisk {...form.getInputProps('sessionId')} />
          <Input.Wrapper label="Platform" withAsterisk>
            <SegmentedControl
              value={form.values.platform}
              onChange={(value) => form.setFieldValue('platform', value)}
              data={[
                {
                  label: <SegmentedControlLabel icon={SiNintendoswitch} label="Rise" />,
                  value: 'Rise (Switch)',
                },
                {
                  label: <SegmentedControlLabel icon={FaSteam} label="Rise" />,
                  value: 'Rise (PC)',
                },
                {
                  label: <SegmentedControlLabel icon={SiNintendoswitch} label="MHGU" />,
                  value: 'MHGU (Switch)',
                },
                {
                  label: <SegmentedControlLabel icon={FaPlaystation} label="World" />,
                  value: 'World (Playstation)',
                },
                {
                  label: <SegmentedControlLabel icon={FaSteam} label="World" />,
                  value: 'World (PC)',
                },
              ]}
            />
          </Input.Wrapper>
          <Textarea
            label="Description"
            placeholder="Hanging out with Khezu"
            {...form.getInputProps('description')}
          />

          <Button color="mhGreen" type="submit">
            Submit
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
