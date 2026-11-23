import { Anchor, Badge, Button, Group, Table, Text } from '@mantine/core';
import { Link } from 'react-router';

import type { ReservationSummary } from '../../api/types';
import { formatTimeRange } from '../resources/formatters';
import { CANCELLABLE_STATUSES, RESERVATION_STATUS_BADGES } from './reservationLabels';

interface MyReservationsTableProps {
  reservations: ReservationSummary[];
  onOpen: (reservation: ReservationSummary) => void;
  onCancel: (reservation: ReservationSummary) => void;
}

/** Tabelul „Rezervările mele”, cu statusul colorat, detaliile și anularea pe fiecare rând. */
export function MyReservationsTable({
  reservations,
  onOpen,
  onCancel,
}: MyReservationsTableProps): React.JSX.Element {
  const rows = reservations.map((reservation) => {
    const badge = RESERVATION_STATUS_BADGES[reservation.status];
    return (
      <Table.Tr key={reservation.id}>
        <Table.Td>
          <Anchor component={Link} to={`/catalog/${String(reservation.resource.id)}`} fw={500}>
            {reservation.resource.name}
          </Anchor>
        </Table.Td>
        <Table.Td>{formatTimeRange(reservation.start, reservation.end)}</Table.Td>
        <Table.Td>{reservation.project.title}</Table.Td>
        <Table.Td>
          <Badge color={badge.color} variant="light">
            {badge.label}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Group gap="xs" wrap="nowrap" justify="flex-end">
            <Button
              size="xs"
              variant="default"
              aria-label={`Detalii rezervarea ${String(reservation.id)}`}
              onClick={() => {
                onOpen(reservation);
              }}
            >
              Detalii
            </Button>
            {CANCELLABLE_STATUSES.includes(reservation.status) && (
              <Button
                size="xs"
                color="red"
                variant="light"
                aria-label={`Anulează rezervarea ${String(reservation.id)}`}
                onClick={() => {
                  onCancel(reservation);
                }}
              >
                Anulează
              </Button>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Resursă</Table.Th>
            <Table.Th>Interval</Table.Th>
            <Table.Th>Proiect</Table.Th>
            <Table.Th>Stare</Table.Th>
            <Table.Th>
              <Text size="sm" fw={700} ta="right">
                Acțiuni
              </Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
