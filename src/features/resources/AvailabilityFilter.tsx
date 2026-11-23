import { CloseButton, Group, Text } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useState } from 'react';

import type { CatalogFilters } from './useCatalogFilters';

/** Orele propuse când se alege doar ziua, ca în exemplul din prototip (o rezervare de 2 ore). */
const DEFAULT_FROM = '09:00';
const DEFAULT_TO = '11:00';

interface AvailabilityFilterProps {
  interval: CatalogFilters['interval'];
  onChange: (interval: CatalogFilters['interval']) => void;
}

interface Draft {
  day: string | null;
  from: string;
  to: string;
}

function toDraft(interval: CatalogFilters['interval']): Draft {
  if (interval === null) {
    return { day: null, from: '', to: '' };
  }
  const start = dayjs(interval.start);
  return {
    day: start.format('YYYY-MM-DD'),
    from: start.format('HH:mm'),
    to: dayjs(interval.end).format('HH:mm'),
  };
}

/** Intervalul din ciornă, dacă e complet și sfârșitul e după început; altfel `null`. */
function toInterval(draft: Draft): CatalogFilters['interval'] {
  if (draft.day === null || draft.from === '' || draft.to === '' || draft.to <= draft.from) {
    return null;
  }
  return {
    start: dayjs(`${draft.day}T${draft.from}`).format(),
    end: dayjs(`${draft.day}T${draft.to}`).format(),
  };
}

/**
 * Filtrul „Disponibil”: ziua și intervalul orar în care resursa trebuie să fie liberă. Cu un
 * interval complet, catalogul arată doar resursele fără rezervări sau mentenanță în el (KAN-71).
 */
export function AvailabilityFilter({
  interval,
  onChange,
}: AvailabilityFilterProps): React.JSX.Element {
  const [draft, setDraft] = useState<Draft>(() => toDraft(interval));
  const invalidOrder = draft.from !== '' && draft.to !== '' && draft.to <= draft.from;

  // Cât timp orele sunt incomplete sau greșite, rămâne ultima căutare validă; doar ștergerea
  // zilei întoarce catalogul complet.
  const change = (next: Draft): void => {
    setDraft(next);
    const complete = toInterval(next);
    if (complete !== null) {
      onChange(complete);
    } else if (next.day === null && interval !== null) {
      onChange(null);
    }
  };

  return (
    <Group gap="xs" align="flex-start" wrap="wrap">
      <DatePickerInput
        aria-label="Disponibil în ziua"
        placeholder="Disponibil în ziua..."
        valueFormat="D MMM YYYY"
        minDate={dayjs().format('YYYY-MM-DD')}
        value={draft.day}
        onChange={(day) => {
          const withTimes = draft.from === '' ? { from: DEFAULT_FROM, to: DEFAULT_TO } : {};
          change({ ...draft, ...withTimes, day });
        }}
        w={170}
      />
      <TimeInput
        aria-label="De la ora"
        value={draft.from}
        disabled={draft.day === null}
        onChange={(event) => {
          change({ ...draft, from: event.currentTarget.value });
        }}
        w={110}
      />
      <TimeInput
        aria-label="Până la ora"
        value={draft.to}
        disabled={draft.day === null}
        error={invalidOrder ? 'După ora de început' : undefined}
        onChange={(event) => {
          change({ ...draft, to: event.currentTarget.value });
        }}
        w={110}
      />
      {draft.day !== null && (
        <CloseButton
          aria-label="Șterge intervalul"
          mt={4}
          onClick={() => {
            change({ day: null, from: '', to: '' });
          }}
        />
      )}
      {draft.day === null && (
        <Text size="sm" c="dimmed" mt={6}>
          Alege o zi ca să vezi doar resursele libere.
        </Text>
      )}
    </Group>
  );
}
