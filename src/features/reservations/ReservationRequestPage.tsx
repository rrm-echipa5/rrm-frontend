import { Alert, Anchor, Breadcrumbs, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { Link, useParams, useSearchParams } from 'react-router';

import { errorMessage } from '../resources/resourceFormSchema';
import { useResourceDetail } from '../resources/useResources';
import type { TimeRange } from './calendarSelection';
import { ReservationRequestForm } from './ReservationRequestForm';

function readRange(params: URLSearchParams): TimeRange | null {
  const start = params.get('start');
  const end = params.get('end');
  if (start === null || end === null || !(Date.parse(end) > Date.parse(start))) {
    return null;
  }
  return { start, end };
}

/**
 * Pagina „Solicită o rezervare” (wireframe-urile 4.1 și 4.2): intervalul vine din calendarul
 * resursei, în adresă (`?start=&end=`), ca pagina să poată fi reîncărcată fără să se piardă.
 */
export function ReservationRequestPage(): React.JSX.Element {
  const resourceId = Number(useParams()['resourceId']);
  const [params] = useSearchParams();
  const range = readRange(params);
  const resource = useResourceDetail(Number.isInteger(resourceId) ? resourceId : null);
  const backToResource = `/catalog/${String(resourceId)}`;

  return (
    <Stack gap="md" py="md">
      <Breadcrumbs>
        <Anchor component={Link} to="/catalog">
          Catalog resurse
        </Anchor>
        <Anchor component={Link} to={backToResource}>
          {resource.data?.name ?? 'Resursa'}
        </Anchor>
        <Text>Solicită o rezervare</Text>
      </Breadcrumbs>
      <div>
        <Title order={2}>Solicită o rezervare</Title>
        <Text c="dimmed">
          Completează detaliile; cererea ajunge la aprobatori după fluxul resursei.
        </Text>
      </div>
      {resource.isPending && (
        <Center py="xl">
          <Loader />
        </Center>
      )}
      {resource.isError && (
        <Alert color="red" title="Resursa nu a putut fi încărcată">
          {errorMessage(resource.error)}
        </Alert>
      )}
      {resource.data && range === null && (
        <Alert color="yellow" title="Alege mai întâi un interval">
          Intervalul se alege în{' '}
          <Anchor component={Link} to={`${backToResource}#calendar`}>
            calendarul resursei
          </Anchor>
          .
        </Alert>
      )}
      {resource.data && range && <ReservationRequestForm resource={resource.data} range={range} />}
    </Stack>
  );
}
