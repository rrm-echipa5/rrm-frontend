import { Alert, Button, Group, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { Link } from 'react-router';

import { formatMinutes, formatWeekdayTime } from '../resources/formatters';
import type { TimeRange } from './calendarSelection';
import { requestPath } from './requestLinks';

interface SelectionSummaryProps {
  resourceId: number;
  selection: TimeRange | null;
  error: string | null;
}

function describe(range: TimeRange): string {
  const minutes = dayjs(range.end).diff(dayjs(range.start), 'minute');
  const end = dayjs(range.end).format('HH:mm');
  return `${formatWeekdayTime(range.start)} – ${end} (${formatMinutes(minutes)})`;
}

/** Intervalul ales în calendar, motivul pentru care nu e valid sau trecerea la formularul cererii. */
export function SelectionSummary({
  resourceId,
  selection,
  error,
}: SelectionSummaryProps): React.JSX.Element {
  if (error !== null) {
    return (
      <Alert color="red" title="Intervalul nu poate fi ales">
        {error}
      </Alert>
    );
  }
  if (selection === null) {
    return (
      <Text size="sm" c="dimmed">
        Alege un interval liber: click pe un slot (durata minimă) sau trage peste mai multe sloturi.
      </Text>
    );
  }
  return (
    <Group justify="space-between">
      <Text size="sm">
        Selecția ta: <strong>{describe(selection)}</strong>
      </Text>
      <Button component={Link} to={requestPath(resourceId, selection)}>
        Continuă cu cererea
      </Button>
    </Group>
  );
}
