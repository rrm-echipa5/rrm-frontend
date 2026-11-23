import {
  Alert,
  Card,
  Center,
  Loader,
  Pagination,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useState } from 'react';

import type { ReservationSummary } from '../../api/types';
import { errorMessage } from '../resources/resourceFormSchema';
import { CancelReservationModal } from './CancelReservationModal';
import { MyReservationsTable } from './MyReservationsTable';
import { ReservationDetailsDrawer } from './ReservationDetailsDrawer';
import { RESERVATION_TABS, type ReservationTab } from './reservationLabels';
import { useMyReservationCounts, useMyReservations } from './useMyReservations';

const PAGE_SIZE = 10;

interface ListProps {
  state: ReturnType<typeof useMyReservations>;
  onOpen: (reservation: ReservationSummary) => void;
  onCancel: (reservation: ReservationSummary) => void;
}

function ReservationList({ state, onOpen, onCancel }: ListProps): React.JSX.Element {
  if (state.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }
  if (state.isError) {
    return (
      <Alert color="red" m="md" title="Rezervările nu au putut fi încărcate">
        {errorMessage(state.error)}
      </Alert>
    );
  }
  if (state.data.content.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Nu ai rezervări în această listă.
      </Text>
    );
  }
  return (
    <MyReservationsTable reservations={state.data.content} onOpen={onOpen} onCancel={onCancel} />
  );
}

/** Pagina „Rezervările mele”: istoricul și statusul cererilor, cu detaliile și anularea. */
export function MyReservationsPage(): React.JSX.Element {
  const [tab, setTab] = useState<ReservationTab>('all');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const [toCancel, setToCancel] = useState<ReservationSummary | null>(null);
  const statuses = RESERVATION_TABS.find((item) => item.value === tab)?.statuses;
  const reservations = useMyReservations({
    page: page - 1,
    size: PAGE_SIZE,
    ...(statuses ? { statuses } : {}),
  });
  const counts = useMyReservationCounts();

  return (
    <Stack gap="md" py="md">
      <div>
        <Title order={2}>Rezervările mele</Title>
        <Text c="dimmed">Istoricul și starea tuturor cererilor tale.</Text>
      </div>
      <SegmentedControl
        w="fit-content"
        value={tab}
        onChange={(value) => {
          setTab(value);
          setPage(1);
        }}
        data={RESERVATION_TABS.map((item) => ({
          value: item.value,
          label:
            counts[item.value] === undefined
              ? item.label
              : `${item.label} (${String(counts[item.value])})`,
        }))}
      />
      <Card withBorder p={0}>
        <ReservationList
          state={reservations}
          onOpen={(reservation) => {
            setOpenId(reservation.id);
          }}
          onCancel={setToCancel}
        />
      </Card>
      {reservations.data && reservations.data.page.totalPages > 1 && (
        <Center>
          <Pagination total={reservations.data.page.totalPages} value={page} onChange={setPage} />
        </Center>
      )}
      <ReservationDetailsDrawer
        reservationId={openId}
        onClose={() => {
          setOpenId(null);
        }}
        onCancel={setToCancel}
      />
      <CancelReservationModal
        reservation={toCancel}
        onClose={() => {
          setToCancel(null);
        }}
      />
    </Stack>
  );
}
