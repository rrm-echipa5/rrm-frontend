import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  List,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCheck, IconClock, IconX } from '@tabler/icons-react';
import { Link } from 'react-router';

import type { ApiError } from '../../api/client';
import type { AlternativeSlot, ProjectBudget, ResourceDetail } from '../../api/types';
import { formatTimeRange } from '../resources/formatters';
import { InfoRow } from '../resources/InfoRow';
import { APPROVAL_FLOW_STEPS } from '../resources/resourceLabels';
import { AlternativeSlotsList } from './AlternativeSlotsList';
import type { TimeRange } from './calendarSelection';
import { rangeHours, type RequestCheck } from './requestChecks';

interface RequestSummaryCardProps {
  resource: ResourceDetail;
  range: TimeRange;
  project: ProjectBudget | null;
  checks: RequestCheck[];
  canSubmit: boolean;
  submitting: boolean;
  error: ApiError | null;
  onSubmit: () => void;
  onChooseSlot: (slot: AlternativeSlot) => void;
}

function CheckIcon({ ok }: { ok: boolean | null }): React.JSX.Element {
  if (ok === null) {
    return (
      <ThemeIcon color="gray" variant="light" size={20} radius="xl">
        <IconClock size={12} />
      </ThemeIcon>
    );
  }
  return (
    <ThemeIcon color={ok ? 'green' : 'red'} variant="light" size={20} radius="xl">
      {ok ? <IconCheck size={12} /> : <IconX size={12} />}
    </ThemeIcon>
  );
}

function BudgetBar({
  project,
  range,
}: {
  project: ProjectBudget;
  range: TimeRange;
}): React.JSX.Element {
  const total = Math.max(project.budgetHours, 1);
  const used = (project.usedHours / total) * 100;
  const request = Math.min((rangeHours(range) / total) * 100, 100 - used);
  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text size="sm" fw={600}>
          Buget de ore al proiectului
        </Text>
        <Text size="sm" fw={600}>
          {project.remainingHours} h rămase din {project.budgetHours} h
        </Text>
      </Group>
      <Progress.Root size="md" aria-label="Bugetul de ore al proiectului">
        <Progress.Section value={used} color="blue" />
        <Progress.Section value={Math.max(request, 0)} color="blue.3" />
      </Progress.Root>
      <Text size="xs" c="dimmed">
        {project.usedHours} h folosite · {rangeHours(range)} h pentru această cerere
      </Text>
    </Stack>
  );
}

function SubmitError({
  error,
  onChooseSlot,
}: Pick<RequestSummaryCardProps, 'error' | 'onChooseSlot'>): React.JSX.Element | null {
  if (error === null) {
    return null;
  }
  if (error.code === 'SLOT_UNAVAILABLE') {
    return (
      <AlternativeSlotsList
        message={error.message}
        slots={error.alternativeSlots}
        onChoose={onChooseSlot}
      />
    );
  }
  return (
    <Alert color="red" title="Cererea nu a fost trimisă">
      {error.message}
    </Alert>
  );
}

/** Pasul 3: rezumatul cererii, verificările automate, bugetul, cine aprobă și trimiterea. */
export function RequestSummaryCard(props: RequestSummaryCardProps): React.JSX.Element {
  const { resource, range, project, checks } = props;
  return (
    <Card withBorder padding="lg">
      <Stack gap="md">
        <Title order={4}>3. Verifică și trimite</Title>
        <Stack gap={6}>
          <InfoRow label="Resursă" value={resource.name} />
          <InfoRow label="Interval" value={formatTimeRange(range.start, range.end)} />
          <InfoRow label="Proiect" value={project?.title ?? '-'} />
        </Stack>
        <div>
          <Text size="sm" fw={600} mb={6}>
            Verificări automate
          </Text>
          <List spacing={6} size="sm" center>
            {checks.map((check) => (
              <List.Item key={check.key} icon={<CheckIcon ok={check.ok} />}>
                {check.label}
              </List.Item>
            ))}
          </List>
        </div>
        {project && <BudgetBar project={project} range={range} />}
        <div>
          <Text size="sm" fw={600} mb={6}>
            Cine aprobă cererea
          </Text>
          <Group gap={6}>
            {APPROVAL_FLOW_STEPS[resource.approvalFlow].map((step) => (
              <Badge key={step} variant="light" tt="none">
                {step}
              </Badge>
            ))}
          </Group>
        </div>
        <SubmitError error={props.error} onChooseSlot={props.onChooseSlot} />
        <Button onClick={props.onSubmit} disabled={!props.canSubmit} loading={props.submitting}>
          Trimite cererea
        </Button>
        <Button variant="default" component={Link} to={`/catalog/${String(resource.id)}`}>
          Renunță
        </Button>
      </Stack>
    </Card>
  );
}
