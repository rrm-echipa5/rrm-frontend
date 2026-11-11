import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

import { getHealth } from '../../api/client';

/** Indicatorul de stare al backend-ului local (`GET /api/health`). */
function ServerStatus(): React.JSX.Element {
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth, retry: false });

  if (health.isPending) {
    return <Badge color="gray">Se verifică...</Badge>;
  }
  if (health.isError) {
    return <Badge color="red">Serverul nu răspunde</Badge>;
  }
  const databaseOk = health.data.database === 'ok';
  return (
    <Group gap="xs">
      <Badge color="green">Server pornit</Badge>
      <Badge color={databaseOk ? 'green' : 'orange'}>
        {databaseOk ? 'Baza de date conectată' : 'Baza de date indisponibilă'}
      </Badge>
    </Group>
  );
}

/** Pagina de start a aplicației. */
export function HomePage(): React.JSX.Element {
  return (
    <Stack gap="lg" py="md">
      <Title order={2}>Bine ai venit</Title>
      <Text c="dimmed">
        Aplicația pentru rezervarea echipamentelor, sălilor și resurselor de calcul ale centrelor de
        cercetare din universitate.
      </Text>
      <Card withBorder>
        <Group justify="space-between">
          <Text fw={500}>Starea backend-ului</Text>
          <ServerStatus />
        </Group>
      </Card>
    </Stack>
  );
}
