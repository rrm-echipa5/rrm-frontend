import { Alert, Badge, Card, Group, Stack, Title } from '@mantine/core';
import { WeekView } from '@mantine/schedule';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import type { UsageRuleSummary } from '../../api/types';
import { formatDayRange } from '../resources/formatters';
import { errorMessage } from '../resources/resourceFormSchema';
import { toEvents } from './calendarEvents';
import { ENTRY_STYLES, OWN_ENTRY_STYLE, SCHEDULE_LABELS, SELECTION_STYLE } from './calendarLabels';
import {
  isSlotUnavailable,
  rangeFromSlot,
  selectionError,
  type TimeRange,
  weekRange,
} from './calendarSelection';
import { SelectionSummary } from './SelectionSummary';
import { useResourceCalendar } from './useResourceCalendar';

/** Sloturile trecute sau ocupate: gri, ca în legenda din wireframe-ul 4.1, și fără click. */
const UNAVAILABLE_SLOT_PROPS = {
  'data-unavailable': true,
  style: { cursor: 'not-allowed', backgroundColor: 'var(--mantine-color-gray-1)' },
};

interface ResourceWeekCalendarProps {
  resourceId: number;
  /** Dacă se pot alege intervale (nu pentru o resursă defectă). */
  selectable: boolean;
}

/** Legenda culorilor, ca sub calendarul din wireframe-ul 4.1. */
function Legend(): React.JSX.Element {
  const items = [...Object.values(ENTRY_STYLES), OWN_ENTRY_STYLE, SELECTION_STYLE];
  return (
    <Group gap="xs">
      {items.map((item) => (
        <Badge key={item.label} color={item.color} variant="light" tt="none" fw={500}>
          {item.label}
        </Badge>
      ))}
    </Group>
  );
}

/**
 * Calendarul săptămânal al resursei (`GET /resources/{resourceId}/calendar`): intervalele ocupate,
 * în așteptare, în mentenanță și rezervările proprii, cu alegerea unui interval liber.
 */
export function ResourceWeekCalendar({
  resourceId,
  selectable,
}: ResourceWeekCalendarProps): React.JSX.Element {
  const [day, setDay] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [selection, setSelection] = useState<TimeRange | null>(null);
  const [error, setError] = useState<string | null>(null);
  const range = useMemo(() => weekRange(day), [day]);
  const calendar = useResourceCalendar(resourceId, range);
  const entries = useMemo(() => calendar.data?.entries ?? [], [calendar.data]);

  const choose = (candidate: TimeRange, rules: UsageRuleSummary): void => {
    const problem = selectionError(candidate, entries, rules, new Date());
    setSelection(problem === null ? candidate : null);
    setError(problem);
  };

  return (
    <Card withBorder padding="lg" id="calendar">
      <Stack gap="md">
        <Title order={4}>Calendar disponibilitate</Title>
        {calendar.isError && (
          <Alert color="red" title="Calendarul nu a putut fi încărcat">
            {errorMessage(calendar.error)}
          </Alert>
        )}
        <WeekView
          date={day}
          onDateChange={(value) => {
            setDay(value);
          }}
          locale="ro"
          labels={SCHEDULE_LABELS}
          viewSelectProps={{ views: ['week'] }}
          renderWeekLabel={({ weekStart }) =>
            formatDayRange(weekStart, dayjs(weekStart).add(4, 'day').format('YYYY-MM-DD'))
          }
          startTime="08:00:00"
          endTime="20:00:00"
          intervalMinutes={30}
          slotLabelInterval={60}
          withWeekendDays={false}
          withAllDaySlots={false}
          withWeekNumber={false}
          highlightToday
          events={toEvents(entries, selection)}
          mode={selectable && calendar.data ? 'default' : 'static'}
          withDragSlotSelect={selectable}
          getTimeSlotProps={(slot) =>
            isSlotUnavailable(slot, entries, new Date()) ? UNAVAILABLE_SLOT_PROPS : undefined
          }
          onTimeSlotClick={({ slotStart }) => {
            if (calendar.data) {
              choose(rangeFromSlot(slotStart, calendar.data.rules), calendar.data.rules);
            }
          }}
          onSlotDragEnd={(start, end) => {
            if (calendar.data) {
              const candidate = {
                start: dayjs(start).format(),
                end: dayjs(end).format(),
              };
              choose(candidate, calendar.data.rules);
            }
          }}
        />
        <Legend />
        {selectable && (
          <SelectionSummary resourceId={resourceId} selection={selection} error={error} />
        )}
      </Stack>
    </Card>
  );
}
