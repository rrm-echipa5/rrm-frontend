import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { Fragment } from 'react';

import type { UsageRule } from '../../api/types';
import { formatMinutes } from './formatters';
import { InfoRow } from './InfoRow';
import { APPROVAL_FLOW_STEPS } from './resourceLabels';

/** Regulile de utilizare ale resursei și etapele fluxului de aprobare. */
export function UsageRulesCard({ rule }: { rule: UsageRule }): React.JSX.Element {
  const level = rule.requiredCertificationLevel;
  const steps = APPROVAL_FLOW_STEPS[rule.approvalFlow];

  return (
    <Card withBorder padding="lg">
      <Title order={4} mb="sm">
        Reguli de utilizare
      </Title>
      <Stack gap={8}>
        <InfoRow
          label="Durată rezervare"
          value={`${formatMinutes(rule.minDurationMinutes)} – ${formatMinutes(rule.maxDurationMinutes)}`}
        />
        <InfoRow
          label="Pauză între rezervări"
          value={rule.breakBetweenMinutes === 0 ? 'Fără' : formatMinutes(rule.breakBetweenMinutes)}
        />
        <InfoRow
          label="Check-in"
          value={`în ${formatMinutes(rule.checkInDeadlineMinutes)} de la început`}
        />
        <InfoRow
          label="Certificare necesară"
          value={level === undefined || level === null ? 'Nu' : `Nivel ${String(level)}`}
        />
        <Group gap={6} mt={4}>
          <Text size="sm" c="dimmed">
            Aprobare:
          </Text>
          {steps.map((step, index) => (
            <Fragment key={step}>
              {index > 0 && <IconArrowRight size={14} aria-label="apoi" />}
              <Badge variant="light" tt="none">
                {step}
              </Badge>
            </Fragment>
          ))}
        </Group>
      </Stack>
    </Card>
  );
}
