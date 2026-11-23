import { Badge, Card, Center, Group, Stack, Text, Title } from '@mantine/core';
import { IconCertificate } from '@tabler/icons-react';
import { Link } from 'react-router';

import type { ResourceSummary } from '../../api/types';
import { APPROVAL_FLOW_LABELS, STATUS_BADGES } from './resourceLabels';

interface ResourceCardProps {
  resource: ResourceSummary;
  /** Filtrele catalogului, păstrate ca fișa să poată reveni la aceeași listă. */
  search: string;
}

/** Cardul unei resurse din catalog: starea colorată, categoria, locația, tag-urile și certificarea. */
export function ResourceCard({ resource, search }: ResourceCardProps): React.JSX.Element {
  const status = STATUS_BADGES[resource.status];
  const location = resource.location ? ` · ${resource.location}` : '';

  return (
    <Card
      withBorder
      padding="md"
      component={Link}
      to={`/catalog/${String(resource.id)}`}
      state={{ catalogSearch: search }}
    >
      <Card.Section>
        <Center h={120} bg="gray.1">
          <Text size="sm" c="dimmed">
            {resource.category.name}
          </Text>
        </Center>
      </Card.Section>
      <Stack gap={6} mt="md">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Title order={3} fz="md" fw={600}>
            {resource.name}
          </Title>
          <Badge color={status.color} variant="light" style={{ flexShrink: 0 }}>
            {status.label}
          </Badge>
        </Group>
        <Text size="sm" c="dimmed">
          {resource.category.name}
          {location}
        </Text>
        <Text size="sm" c="dimmed">
          Aprobare: {APPROVAL_FLOW_LABELS[resource.approvalFlow]}
        </Text>
        <CertificationHint resource={resource} />
        {resource.tags.length > 0 && (
          <Group gap={6}>
            {resource.tags.map((tag) => (
              <Badge key={tag} variant="outline" color="gray" tt="none" fw={400}>
                {tag}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>
    </Card>
  );
}

function CertificationHint({ resource }: { resource: ResourceSummary }): React.JSX.Element | null {
  const level = resource.requiredCertificationLevel;
  if (level === undefined || level === null) {
    return null;
  }
  const certified = resource.userCertified === true;
  return (
    <Group gap={4} c={certified ? 'green.8' : 'orange.8'}>
      <IconCertificate size={16} aria-hidden />
      <Text size="sm" c="inherit">
        {certified
          ? `Ai certificarea (nivel ${level} cerut)`
          : `Necesită certificare nivel ${level}, pe care nu o ai`}
      </Text>
    </Group>
  );
}
