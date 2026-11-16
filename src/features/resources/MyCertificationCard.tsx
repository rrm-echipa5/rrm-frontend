import { Badge, Card, Group, Loader, Text, Title } from '@mantine/core';

import type { Certification } from '../../api/types';
import { formatDate } from './formatters';
import { CERTIFICATION_BADGES } from './resourceLabels';
import { useMyCertifications } from './useResources';

interface MyCertificationCardProps {
  resourceId: number;
  /** Nivelul cerut de regulile resursei; `null` dacă resursa nu cere certificare. */
  requiredLevel: number | null;
}

function describe(cert: Certification): string {
  if (cert.status === 'REVOKED') {
    return `Nivel ${String(cert.level)} · ${cert.revokeReason ?? 'retrasă de administrator'}`;
  }
  if (cert.expiresAt === undefined || cert.expiresAt === null) {
    return `Nivel ${String(cert.level)} · fără dată de expirare`;
  }
  const verb = cert.status === 'EXPIRED' ? 'a expirat la' : 'valabilă până la';
  return `Nivel ${String(cert.level)} · ${verb} ${formatDate(cert.expiresAt)}`;
}

/** Certificarea utilizatorului curent pentru resursă (`GET /users/me/certifications`). */
export function MyCertificationCard({
  resourceId,
  requiredLevel,
}: MyCertificationCardProps): React.JSX.Element {
  const certifications = useMyCertifications();
  const cert = certifications.data?.find((candidate) => candidate.resource.id === resourceId);

  return (
    <Card withBorder padding="lg">
      <Group justify="space-between" mb="xs">
        <Title order={4}>Certificarea ta</Title>
        {cert && (
          <Badge color={CERTIFICATION_BADGES[cert.status].color} variant="light">
            {CERTIFICATION_BADGES[cert.status].label}
          </Badge>
        )}
      </Group>
      <CertificationText
        loading={certifications.isPending}
        failed={certifications.isError}
        cert={cert}
        requiredLevel={requiredLevel}
      />
    </Card>
  );
}

interface CertificationTextProps {
  loading: boolean;
  failed: boolean;
  cert: Certification | undefined;
  requiredLevel: number | null;
}

function CertificationText({
  loading,
  failed,
  cert,
  requiredLevel,
}: CertificationTextProps): React.JSX.Element {
  if (loading) {
    return <Loader size="sm" />;
  }
  if (failed) {
    return (
      <Text size="sm" c="red">
        Certificările nu au putut fi încărcate.
      </Text>
    );
  }
  if (cert) {
    return (
      <Text size="sm" c="dimmed">
        {describe(cert)}
      </Text>
    );
  }
  return (
    <Text size="sm" c={requiredLevel === null ? 'dimmed' : 'orange.8'}>
      {requiredLevel === null
        ? 'Resursa nu cere certificare.'
        : `Nu ai certificare pentru această resursă; este cerut nivelul ${String(requiredLevel)}.`}
    </Text>
  );
}
