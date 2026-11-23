import { Alert, Text } from '@mantine/core';
import { IconTool } from '@tabler/icons-react';

import type { MaintenanceBlock } from '../../api/types';
import { formatDateTime } from './formatters';
import { WORK_TYPE_LABELS } from './resourceLabels';

function interval(block: MaintenanceBlock): string {
  const start = formatDateTime(block.start);
  if (block.end === undefined || block.end === null) {
    return `din ${start}, pe durată nedeterminată`;
  }
  return `${start} – ${formatDateTime(block.end)}`;
}

/** Mentenanța în curs sau următoarea programată (`currentOrNextMaintenance`). */
export function MaintenanceAlert({ block }: { block: MaintenanceBlock }): React.JSX.Element {
  const work = WORK_TYPE_LABELS[block.workType];
  const active = block.status === 'ACTIVE';
  const title = active ? `${work} în curs` : `${work} programată`;

  return (
    <Alert color={active ? 'orange' : 'yellow'} icon={<IconTool size={18} />} title={title}>
      <Text size="sm">
        {interval(block)}
        {block.reason ? `: ${block.reason}` : ''}
      </Text>
      <Text size="sm" c="dimmed">
        {active
          ? 'Resursa nu poate fi rezervată până la încheierea lucrării.'
          : 'Intervalul nu poate fi rezervat.'}
      </Text>
    </Alert>
  );
}
