import { Alert, Center, Loader, Pagination, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useLocation } from 'react-router';

import { CatalogFilterBar } from './CatalogFilterBar';
import { ResourceCard } from './ResourceCard';
import { errorMessage } from './resourceFormSchema';
import { useCatalogFilters } from './useCatalogFilters';
import { useResourceList } from './useResources';

/** Câte resurse încap pe o pagină: 4 rânduri de câte 3 carduri pe desktop. */
const CATALOG_PAGE_SIZE = 12;

/** Pagina „Catalog resurse”: toate resursele, cu filtre combinate și starea colorată. */
export function CatalogPage(): React.JSX.Element {
  const { filters, update, setPage, reset } = useCatalogFilters();
  const { search } = useLocation();
  const resources = useResourceList({
    page: filters.page - 1,
    size: CATALOG_PAGE_SIZE,
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.categoryId === null ? {} : { categoryId: filters.categoryId }),
    statuses: filters.statuses,
    tags: filters.tags,
  });

  return (
    <Stack gap="md" py="md">
      <div>
        <Title order={2}>Catalog resurse</Title>
        <Text c="dimmed">
          Toate resursele de cercetare ale universității, cu starea lor actuală.
        </Text>
      </div>
      <CatalogFilterBar filters={filters} onChange={update} onReset={reset} />
      <CatalogContent state={resources} search={search} />
      {resources.data && resources.data.page.totalPages > 1 && (
        <Center>
          <Pagination
            total={resources.data.page.totalPages}
            value={filters.page}
            onChange={setPage}
          />
        </Center>
      )}
    </Stack>
  );
}

interface CatalogContentProps {
  state: ReturnType<typeof useResourceList>;
  search: string;
}

function CatalogContent({ state, search }: CatalogContentProps): React.JSX.Element {
  if (state.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }
  if (state.isError) {
    return (
      <Alert color="red" title="Catalogul nu a putut fi încărcat">
        {errorMessage(state.error)}
      </Alert>
    );
  }
  if (state.data.content.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Nicio resursă nu corespunde filtrelor alese.
      </Text>
    );
  }
  return (
    <>
      <Text size="sm" c="dimmed" aria-live="polite">
        {state.data.page.totalElements === 1
          ? '1 resursă'
          : `${String(state.data.page.totalElements)} resurse`}
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {state.data.content.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} search={search} />
        ))}
      </SimpleGrid>
    </>
  );
}
