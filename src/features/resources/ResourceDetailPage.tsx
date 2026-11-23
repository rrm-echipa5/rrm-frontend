import {
  Alert,
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Center,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconCalendarEvent, IconCalendarPlus } from '@tabler/icons-react';
import { Link, useLocation, useParams } from 'react-router';

import type { ResourceDetail } from '../../api/types';
import { ResourceWeekCalendar } from '../reservations/ResourceWeekCalendar';
import { MaintenanceAlert } from './MaintenanceAlert';
import { MyCertificationCard } from './MyCertificationCard';
import { errorMessage } from './resourceFormSchema';
import { STATUS_BADGES } from './resourceLabels';
import { ResourceOverview } from './ResourceOverview';
import { UsageRulesCard } from './UsageRulesCard';
import { useResourceDetail } from './useResources';

/** Adresa catalogului, cu filtrele de dinainte de deschiderea fișei (dacă există). */
function useCatalogLink(): string {
  const { state } = useLocation() as { state: { catalogSearch?: string } | null };
  return `/catalog${state?.catalogSearch ?? ''}`;
}

/** Pagina „Fișa resursei” (`GET /resources/{resourceId}`). */
export function ResourceDetailPage(): React.JSX.Element {
  const { resourceId } = useParams();
  const id = Number(resourceId);
  const resource = useResourceDetail(Number.isInteger(id) && id > 0 ? id : null);
  const catalogLink = useCatalogLink();

  if (resource.isError || !Number.isInteger(id) || id <= 0) {
    return (
      <Stack gap="md" py="md">
        <Alert color="red" title="Fișa resursei nu a putut fi încărcată">
          {resource.isError ? errorMessage(resource.error) : 'Adresa nu conține o resursă validă.'}
        </Alert>
        <Anchor component={Link} to={catalogLink}>
          Înapoi la catalog
        </Anchor>
      </Stack>
    );
  }
  if (resource.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }
  return <ResourceDetailView resource={resource.data} catalogLink={catalogLink} />;
}

interface ResourceDetailViewProps {
  resource: ResourceDetail;
  catalogLink: string;
}

function ResourceDetailView({ resource, catalogLink }: ResourceDetailViewProps): React.JSX.Element {
  const status = STATUS_BADGES[resource.status];
  const requiredLevel = resource.usageRule.requiredCertificationLevel ?? null;

  return (
    <Stack gap="md" py="md">
      <Breadcrumbs>
        <Anchor component={Link} to={catalogLink} size="sm">
          Catalog resurse
        </Anchor>
        <Text size="sm" c="dimmed">
          {resource.name}
        </Text>
      </Breadcrumbs>
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <Title order={2}>{resource.name}</Title>
          <Badge color={status.color} variant="light" size="lg">
            {status.label}
          </Badge>
        </Group>
        <ReservationActions resource={resource} />
      </Group>
      {resource.currentOrNextMaintenance && (
        <MaintenanceAlert block={resource.currentOrNextMaintenance} />
      )}
      <Grid gap="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <ResourceOverview resource={resource} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <UsageRulesCard rule={resource.usageRule} />
            <MyCertificationCard resourceId={resource.id} requiredLevel={requiredLevel} />
          </Stack>
        </Grid.Col>
      </Grid>
      <ResourceWeekCalendar resourceId={resource.id} selectable={resource.status !== 'FAULTY'} />
    </Stack>
  );
}

/**
 * „Vezi calendarul” și „Solicită rezervare” duc la calendarul de sub fișă: cererea pornește de la
 * intervalul ales acolo (cazul de utilizare 2.1). O resursă care nu e activă nu poate fi rezervată.
 */
function ReservationActions({ resource }: { resource: ResourceDetail }): React.JSX.Element {
  const unavailable = resource.status !== 'ACTIVE';
  // `data-disabled` (nu `disabled`) păstrează tooltip-ul, care explică de ce butonul e inactiv.
  const inactive = {
    'data-disabled': true,
    'aria-disabled': true,
    onClick: (event: React.MouseEvent) => {
      event.preventDefault();
    },
  };
  const requestHint = unavailable
    ? `Resursa este ${STATUS_BADGES[resource.status].label.toLowerCase()} și nu poate fi rezervată.`
    : 'Alege intervalul în calendar, apoi „Continuă cu cererea”.';

  return (
    <Group gap="sm">
      <Button
        variant="default"
        leftSection={<IconCalendarEvent size={16} />}
        component="a"
        href="#calendar"
      >
        Vezi calendarul
      </Button>
      <Tooltip label={requestHint}>
        {unavailable ? (
          <Button leftSection={<IconCalendarPlus size={16} />} {...inactive}>
            Solicită rezervare
          </Button>
        ) : (
          <Button leftSection={<IconCalendarPlus size={16} />} component="a" href="#calendar">
            Solicită rezervare
          </Button>
        )}
      </Tooltip>
    </Group>
  );
}
