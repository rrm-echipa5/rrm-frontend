import { Alert, Button, Stack, Text } from '@mantine/core';

import type { AlternativeSlot } from '../../api/types';
import { formatTimeRange } from '../resources/formatters';

interface AlternativeSlotsListProps {
  message: string;
  slots: AlternativeSlot[];
  onChoose: (slot: AlternativeSlot) => void;
}

/**
 * Intervalul ales s-a ocupat între timp (409): sloturile libere propuse de server, pentru aceeași
 * resursă sau pentru una similară. Alegerea unuia completează din nou formularul.
 */
export function AlternativeSlotsList({
  message,
  slots,
  onChoose,
}: AlternativeSlotsListProps): React.JSX.Element {
  return (
    <Alert color="orange" title="Intervalul nu mai este liber">
      <Stack gap="xs">
        <Text size="sm">{message}</Text>
        {slots.length === 0 ? (
          <Text size="sm">Nu am găsit intervale libere apropiate; alege altul în calendar.</Text>
        ) : (
          <Text size="sm">Poți alege unul dintre intervalele libere:</Text>
        )}
        {slots.map((slot) => (
          <Button
            key={`${String(slot.resource.id)}-${slot.start}`}
            variant="default"
            size="xs"
            fullWidth
            justify="flex-start"
            h="auto"
            py={6}
            // Textul unui slot pentru altă resursă e lung; se rupe pe mai multe rânduri în card.
            styles={{ label: { whiteSpace: 'normal', textAlign: 'left' } }}
            onClick={() => {
              onChoose(slot);
            }}
          >
            {formatTimeRange(slot.start, slot.end)}
            {slot.sameResource ? '' : ` · ${slot.resource.name} (resursă similară)`}
          </Button>
        ))}
      </Stack>
    </Alert>
  );
}
