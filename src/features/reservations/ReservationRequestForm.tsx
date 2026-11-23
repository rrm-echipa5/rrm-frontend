import { Grid, Stack } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import type { AlternativeSlot, ResourceDetail } from '../../api/types';
import { useMyCertifications } from '../resources/useResources';
import type { TimeRange } from './calendarSelection';
import { requestChecks } from './requestChecks';
import { PURPOSE_MIN_LENGTH, type RequestDetails, RequestDetailsForm } from './RequestDetailsForm';
import { RequestIntervalCard } from './RequestIntervalCard';
import { requestPath } from './requestLinks';
import { RequestSummaryCard } from './RequestSummaryCard';
import { useCreateReservation, useMyProjects } from './useReservationRequest';

interface ReservationRequestFormProps {
  resource: ResourceDetail;
  range: TimeRange;
}

/**
 * Formularul cererii (cazul de utilizare 2.1): datele completate, verificările și trimiterea
 * (`POST /api/reservations`). La 201 se deschide confirmarea; la 409, sloturile alternative.
 */
export function ReservationRequestForm({
  resource,
  range,
}: ReservationRequestFormProps): React.JSX.Element {
  const navigate = useNavigate();
  const projects = useMyProjects();
  const certifications = useMyCertifications();
  const create = useCreateReservation();
  const [details, setDetails] = useState<RequestDetails>({
    projectId: null,
    purpose: '',
    rulesAccepted: false,
  });
  const project = projects.data?.find((item) => String(item.id) === details.projectId) ?? null;
  const checks = requestChecks({
    resourceId: resource.id,
    rule: resource.usageRule,
    certifications: certifications.data ?? [],
    range,
    project,
  });
  const canSubmit =
    project !== null &&
    details.purpose.trim().length >= PURPOSE_MIN_LENGTH &&
    details.rulesAccepted &&
    checks.every((check) => check.ok === true);

  const submit = (): void => {
    if (project === null) {
      return;
    }
    const body = {
      resourceId: resource.id,
      projectId: project.id,
      ...range,
      purpose: details.purpose.trim(),
    };
    create.mutate(body, {
      onSuccess: (reservation) => {
        void navigate(`/reservations/${String(reservation.id)}/sent`);
      },
    });
  };
  const chooseSlot = (slot: AlternativeSlot): void => {
    create.reset();
    void navigate(requestPath(slot.resource.id, slot), { replace: true });
  };

  return (
    <Grid gap="md">
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Stack gap="md">
          <RequestIntervalCard resource={resource} range={range} />
          <RequestDetailsForm
            projects={projects.data ?? []}
            value={details}
            onChange={setDetails}
          />
        </Stack>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 5 }}>
        <RequestSummaryCard
          resource={resource}
          range={range}
          project={project}
          checks={checks}
          canSubmit={canSubmit}
          submitting={create.isPending}
          error={create.error}
          onSubmit={submit}
          onChooseSlot={chooseSlot}
        />
      </Grid.Col>
    </Grid>
  );
}
