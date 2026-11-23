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
    </Stack>
  );
}

/**
 * Calendarul resursei și formularul de rezervare se deschid din fișă; paginile lor vin în KAN-72 și
 * KAN-76, deci până atunci butoanele sunt vizibile, dar inactive.
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
    : 'Formularul de rezervare urmează (KAN-76).';

  return (
    <Group gap="sm">
      <Tooltip label="Calendarul resursei urmează (KAN-72).">
        <Button variant="default" leftSection={<IconCalendarEvent size={16} />} {...inactive}>
          Vezi calendarul
        </Button>
      </Tooltip>
      <Tooltip label={requestHint}>
        <Button leftSection={<IconCalendarPlus size={16} />} {...inactive}>
          Solicită rezervare
        </Button>
      </Tooltip>
    </Group>
  );
}
