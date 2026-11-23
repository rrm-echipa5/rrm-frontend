import {
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Drawer,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Link } from 'react-router';

import type { Reservation, ReservationSummary } from '../../api/types';
import { formatDateTime, formatTimeRange } from '../resources/formatters';
import { InfoRow } from '../resources/InfoRow';
import { errorMessage } from '../resources/resourceFormSchema';
import { ReservationHistory } from './ReservationHistory';
import { CANCELLABLE_STATUSES, RESERVATION_STATUS_BADGES } from './reservationLabels';
import { useReservation } from './useMyReservations';

interface ReservationDetailsDrawerProps {
  /** Rezervarea deschisă; `null` când panoul e închis. */
  reservationId: number | null;
  onClose: () => void;
  onCancel: (reservation: ReservationSummary) => void;
}

function hoursLabel(hours: number): string {
  return `${hours.toLocaleString('ro-RO', { maximumFractionDigits: 2 })} h`;
}

function ReservationDetails({
  reservation,
  onCancel,
}: {
  reservation: Reservation;
  onCancel: (reservation: ReservationSummary) => void;
}): React.JSX.Element {
  const badge = RESERVATION_STATUS_BADGES[reservation.status];
  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap">
        <Anchor component={Link} to={`/catalog/${String(reservation.resource.id)}`} fw={600}>
          {reservation.resource.name}
        </Anchor>
        <Badge color={badge.color} variant="light">
          {badge.label}
        </Badge>
      </Group>
      <Stack gap={6}>
        <InfoRow label="Interval" value={formatTimeRange(reservation.start, reservation.end)} />
        <InfoRow label="Proiect" value={reservation.project.title} />
        <InfoRow label="Ore din buget" value={hoursLabel(reservation.hours)} />
        <InfoRow label="Check-in până la" value={formatDateTime(reservation.checkInDeadline)} />
        {reservation.checkInAt && (
          <InfoRow label="Check-in" value={formatDateTime(reservation.checkInAt)} />
        )}
        {reservation.checkOutAt && (
          <InfoRow label="Check-out" value={formatDateTime(reservation.checkOutAt)} />
        )}
      </Stack>
      <div>
        <Text size="sm" c="dimmed">
          Scopul utilizării
        </Text>
        <Text size="sm">{reservation.purpose}</Text>
      </div>
      <Title order={5}>Istoricul cererii</Title>
      <ReservationHistory reservation={reservation} />
      {CANCELLABLE_STATUSES.includes(reservation.status) && (
        <Button
          color="red"
          variant="light"
          onClick={() => {
            onCancel(reservation);
          }}
        >
          Anulează rezervarea
        </Button>
      )}
    </Stack>
  );
}

/** Detaliile rezervării (`GET /api/reservations/{id}`), cu istoricul aprobărilor și anularea. */
export function ReservationDetailsDrawer({
  reservationId,
  onClose,
  onCancel,
}: ReservationDetailsDrawerProps): React.JSX.Element {
  const reservation = useReservation(reservationId);
  return (
    <Drawer
      opened={reservationId !== null}
      onClose={onClose}
      position="right"
      title={`Rezervarea ${String(reservationId ?? '')}`}
    >
      {reservation.isPending && (
        <Center py="xl">
          <Loader />
        </Center>
      )}
      {reservation.isError && (
        <Alert color="red" title="Rezervarea nu a putut fi încărcată">
          {errorMessage(reservation.error)}
        </Alert>
      )}
      {reservation.data && (
        <ReservationDetails reservation={reservation.data} onCancel={onCancel} />
      )}
    </Drawer>
  );
}
