import {
  Alert,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Pagination,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';

import type { ResourceSummary } from '../../api/types';
import { type ResourcePermissions, resourcePermissions } from '../users/permissions';
import { useCurrentUser } from '../users/useCurrentUser';
import { DeleteResourceModal } from './DeleteResourceModal';
import { ResourceFilters } from './ResourceFilters';
import { ResourceFormModal } from './ResourceFormModal';
import { errorMessage } from './resourceFormSchema';
import { ResourcesTable } from './ResourcesTable';
import { useResourceList } from './useResources';

const PAGE_SIZE = 10;

type FormState = { open: false } | { open: true; resourceId: number | null };

/** Pagina „Resurse”: catalogul, cu adăugarea, modificarea și ștergerea resurselor. */
export function ResourcesPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState<FormState>({ open: false });
  const [toDelete, setToDelete] = useState<ResourceSummary | null>(null);
  const permissions = resourcePermissions(useCurrentUser().data?.role ?? null);

  const resources = useResourceList({
    page: page - 1,
    size: PAGE_SIZE,
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
    ...(categoryId ? { categoryId: Number(categoryId) } : {}),
  });

  return (
    <Stack gap="md" py="md">
      <PageHeader
        canCreate={permissions.canCreate}
        onCreate={() => {
          setFormState({ open: true, resourceId: null });
        }}
      />
      <ResourceFilters
        search={search}
        categoryId={categoryId}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onCategoryChange={(value) => {
          setCategoryId(value);
          setPage(1);
        }}
      />
      <Card withBorder p={0}>
        <ResourceListContent
          state={resources}
          permissions={permissions}
          onEdit={(resource) => {
            setFormState({ open: true, resourceId: resource.id });
          }}
          onDelete={setToDelete}
        />
      </Card>
      {resources.data && resources.data.page.totalPages > 1 && (
        <Center>
          <Pagination total={resources.data.page.totalPages} value={page} onChange={setPage} />
        </Center>
      )}
      <ResourceFormModal
        opened={formState.open}
        resourceId={formState.open ? formState.resourceId : null}
        onClose={() => {
          setFormState({ open: false });
        }}
      />
      <DeleteResourceModal
        resource={toDelete}
        onClose={() => {
          setToDelete(null);
        }}
      />
    </Stack>
  );
}

interface PageHeaderProps {
  canCreate: boolean;
  onCreate: () => void;
}

/** Titlul paginii, cu butonul de adăugare dacă rolul curent poate adăuga resurse. */
function PageHeader({ canCreate, onCreate }: PageHeaderProps): React.JSX.Element {
  return (
    <Group justify="space-between">
      <Title order={2}>Resurse</Title>
      {canCreate && (
        <Button leftSection={<IconPlus size={16} />} onClick={onCreate}>
          Adaugă resursă
        </Button>
      )}
    </Group>
  );
}

interface ResourceListContentProps {
  state: ReturnType<typeof useResourceList>;
  permissions: ResourcePermissions;
  onEdit: (resource: ResourceSummary) => void;
  onDelete: (resource: ResourceSummary) => void;
}

function ResourceListContent({
  state,
  permissions,
  onEdit,
  onDelete,
}: ResourceListContentProps): React.JSX.Element {
  if (state.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }
  if (state.isError) {
    return (
      <Alert color="red" m="md" title="Catalogul nu a putut fi încărcat">
        {errorMessage(state.error)}
      </Alert>
    );
  }
  if (state.data.content.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Nicio resursă nu corespunde căutării.
      </Text>
    );
  }
  return (
    <ResourcesTable
      resources={state.data.content}
      onEdit={permissions.canEdit ? onEdit : null}
      onDelete={permissions.canDelete ? onDelete : null}
    />
  );
}
