import { Card, Checkbox, Select, Stack, Text, Textarea, Title } from '@mantine/core';

import type { ProjectBudget } from '../../api/types';

/** Ce completează utilizatorul în pasul 2. */
export interface RequestDetails {
  projectId: string | null;
  purpose: string;
  rulesAccepted: boolean;
}

/** Lungimile permise pentru scopul utilizării (`ReservationCreateRequest.purpose`). */
export const PURPOSE_MIN_LENGTH = 3;
export const PURPOSE_MAX_LENGTH = 500;

interface RequestDetailsFormProps {
  projects: ProjectBudget[];
  value: RequestDetails;
  onChange: (value: RequestDetails) => void;
}

function hours(value: number): string {
  return value.toLocaleString('ro-RO', { maximumFractionDigits: 2 });
}

/** Pasul 2: proiectul din al cărui buget se scad orele, scopul utilizării și regulile citite. */
export function RequestDetailsForm({
  projects,
  value,
  onChange,
}: RequestDetailsFormProps): React.JSX.Element {
  const shortPurpose = value.purpose !== '' && value.purpose.trim().length < PURPOSE_MIN_LENGTH;
  return (
    <Card withBorder padding="lg">
      <Stack gap="md">
        <div>
          <Title order={4}>2. Detaliile cererii</Title>
          <Text size="sm" c="dimmed">
            Informațiile ajung la aprobatori împreună cu cererea.
          </Text>
        </div>
        <Select
          label="Proiect"
          placeholder="Alege proiectul"
          required
          data={projects.map((project) => ({
            value: String(project.id),
            label: `${project.title} (${hours(project.remainingHours)} h rămase)`,
          }))}
          value={value.projectId}
          onChange={(projectId) => {
            onChange({ ...value, projectId });
          }}
          nothingFoundMessage="Nu faci parte din niciun proiect"
        />
        <Textarea
          label="Scopul utilizării"
          required
          autosize
          minRows={3}
          maxLength={PURPOSE_MAX_LENGTH}
          error={shortPurpose ? `Cel puțin ${String(PURPOSE_MIN_LENGTH)} caractere.` : undefined}
          value={value.purpose}
          onChange={(event) => {
            onChange({ ...value, purpose: event.currentTarget.value });
          }}
        />
        <Checkbox
          label="Am citit regulile de utilizare ale resursei"
          checked={value.rulesAccepted}
          onChange={(event) => {
            onChange({ ...value, rulesAccepted: event.currentTarget.checked });
          }}
        />
      </Stack>
    </Card>
  );
}
