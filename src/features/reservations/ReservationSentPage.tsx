import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { Link, useParams } from 'react-router';

import type { Reservation } from '../../api/types';
import { formatTimeRange } from '../resources/formatters';
import { InfoRow } from '../resources/InfoRow';
import { errorMessage } from '../resources/resourceFormSchema';
import { RESERVATION_STATUS_BADGES } from './reservationLabels';
import { useReservation } from './useMyReservations';

/** Ce urmează după trimitere, după status și fluxul de aprobare al resursei. */
function nextSteps(reservation: Reservation): string {
  if (reservation.status === 'CONFIRMED') {
    return 'Intervalul este al tău. Fă check-in la resursă în termenul din regulile ei.';
  }
  const admin =
    reservation.approvalFlow === 'COORDINATOR_AND_ADMIN'
      ? ` Pentru ${reservation.resource.name} este nevoie și de avizul Administratorului Resursei.`
      : '';
  return `Coordonatorul echipei tale a primit cererea.${admin} Vei primi o notificare la fiecare decizie.`;
}

function SentCard({ reservation }: { reservation: Reservation }): React.JSX.Element {
  const badge = RESERVATION_STATUS_BADGES[reservation.status];
  const confirmed = reservation.status === 'CONFIRMED';
  return (
    <Card withBorder padding="xl" maw={560} mx="auto">
      <Stack gap="md" align="center">
        <ThemeIcon color="green" variant="light" size={56} radius="xl">
          <IconCheck size={28} />
        </ThemeIcon>
        <Title order={2} ta="center">
          {confirmed ? 'Rezervarea a fost confirmată' : 'Cererea a fost trimisă'}
        </Title>
        <Text c="dimmed" ta="center">
          {nextSteps(reservation)}
        </Text>
        <Stack gap={6} w="100%">
          <InfoRow label="Resursă" value={reservation.resource.name} />
          <InfoRow label="Interval" value={formatTimeRange(reservation.start, reservation.end)} />
          <InfoRow label="Proiect" value={reservation.project.title} />
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Stare
            </Text>
            <Badge color={badge.color} variant="light">
              {badge.label}
            </Badge>
          </Group>
        </Stack>
        <Group>
          <Button component={Link} to="/reservations">
            Vezi rezervările mele
          </Button>
          <Button variant="default" component={Link} to="/catalog">
            Înapoi la catalog
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

/** Confirmarea după `POST /reservations` (prototipul, ecranul „Cerere trimisă”). */
export function ReservationSentPage(): React.JSX.Element {
  const reservationId = Number(useParams()['reservationId']);
  const reservation = useReservation(Number.isInteger(reservationId) ? reservationId : null);
  if (reservation.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }
  if (reservation.isError) {
    return (
      <Alert color="red" my="md" title="Cererea nu a putut fi încărcată">
        {errorMessage(reservation.error)}
      </Alert>
    );
  }
  return (
    <Stack py="xl">
      <SentCard reservation={reservation.data} />
    </Stack>
  );
}
