import { Alert, Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import type { ReservationSummary } from '../../api/types';
import { formatTimeRange } from '../resources/formatters';
import { errorMessage } from '../resources/resourceFormSchema';
import { useCancelReservation } from './useMyReservations';

const REASON_MAX_LENGTH = 500;

interface CancelReservationModalProps {
  /** Rezervarea de anulat; `null` când fereastra e închisă. */
  reservation: ReservationSummary | null;
  onClose: () => void;
}

/** Dialogul de anulare, cu motivul opțional (`POST /api/reservations/{id}/cancel`). */
export function CancelReservationModal({
  reservation,
  onClose,
}: CancelReservationModalProps): React.JSX.Element {
  const [reason, setReason] = useState('');
  const cancel = useCancelReservation();

  const close = (): void => {
    setReason('');
    cancel.reset();
    onClose();
  };

  const confirm = (): void => {
    if (reservation === null) {
      return;
    }
    cancel.mutate(
      { reservationId: reservation.id, reason },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message: `Rezervarea pentru „${reservation.resource.name}” a fost anulată.`,
          });
          close();
        },
      },
    );
  };

  return (
    <Modal opened={reservation !== null} onClose={close} title="Anulezi rezervarea?">
      <Stack gap="md">
        {reservation && (
          <Text size="sm">
            <b>{reservation.resource.name}</b>,{' '}
            {formatTimeRange(reservation.start, reservation.end)}. Intervalul se eliberează, iar
            pentru o rezervare confirmată orele revin în bugetul proiectului.
          </Text>
        )}
        <Textarea
          label="Motivul (opțional)"
          description="Îl văd aprobatorii notificați."
          autosize
          minRows={2}
          maxLength={REASON_MAX_LENGTH}
          value={reason}
          onChange={(event) => {
            setReason(event.currentTarget.value);
          }}
        />
        {cancel.isError && (
          <Alert color="red" title="Rezervarea nu a putut fi anulată">
            {errorMessage(cancel.error)}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            Renunță
          </Button>
          <Button color="red" loading={cancel.isPending} onClick={confirm}>
            Anulează rezervarea
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
