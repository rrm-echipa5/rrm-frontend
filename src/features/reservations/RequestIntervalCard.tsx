import { Anchor, Card, Group, Text, Title } from '@mantine/core';
import { Link } from 'react-router';

import type { ResourceDetail } from '../../api/types';
import { formatMinutes, formatTimeRange } from '../resources/formatters';
import type { TimeRange } from './calendarSelection';

interface RequestIntervalCardProps {
  resource: ResourceDetail;
  range: TimeRange;
}

/** Pasul 1: intervalul ales în calendarul resursei, cu legătura înapoi pentru a-l schimba. */
export function RequestIntervalCard({
  resource,
  range,
}: RequestIntervalCardProps): React.JSX.Element {
  const rule = resource.usageRule;
  return (
    <Card withBorder padding="lg">
      <Title order={4}>1. Intervalul ales</Title>
      <Text size="sm" c="dimmed">
        {resource.name} · reguli: minim {formatMinutes(rule.minDurationMinutes)}, maxim{' '}
        {formatMinutes(rule.maxDurationMinutes)} pe rezervare
      </Text>
      <Group justify="space-between" mt="md">
        <Text fw={600}>{formatTimeRange(range.start, range.end)}</Text>
        <Anchor component={Link} to={`/catalog/${String(resource.id)}#calendar`} size="sm">
          Schimbă intervalul în calendar
        </Anchor>
      </Group>
    </Card>
  );
}
