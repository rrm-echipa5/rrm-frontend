import { Button, Card, Chip, Group, Select, SimpleGrid, TagsInput, TextInput } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';

import type { ResourceStatus } from '../../api/types';
import { STATUS_BADGES } from './resourceLabels';
import type { CatalogFilters, CatalogFiltersUpdate } from './useCatalogFilters';
import { useResourceCategories } from './useResources';

const STATUSES = Object.keys(STATUS_BADGES) as ResourceStatus[];

interface CatalogFilterBarProps {
  filters: CatalogFilters;
  onChange: (changes: CatalogFiltersUpdate) => void;
  onReset: () => void;
}

/** Filtrele catalogului: textul căutat, categoria, stările și tag-urile, combinate între ele. */
export function CatalogFilterBar({
  filters,
  onChange,
  onReset,
}: CatalogFilterBarProps): React.JSX.Element {
  const categories = useResourceCategories();
  const options = (categories.data ?? []).map((c) => ({ value: String(c.id), label: c.name }));
  // Textul se scrie imediat în câmp, dar ajunge în adresă (și în API) după o scurtă pauză.
  const [search, setSearch] = useState(filters.q);
  const commitSearch = useDebouncedCallback((value: string) => {
    onChange({ q: value.trim() });
  }, 300);
  const hasFilters =
    filters.q !== '' ||
    filters.categoryId !== null ||
    filters.statuses.length > 0 ||
    filters.tags.length > 0;

  return (
    <Card withBorder padding="md">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        <TextInput
          placeholder="Caută după denumire, locație sau specificații"
          aria-label="Caută resurse"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            commitSearch(event.currentTarget.value);
          }}
        />
        <Select
          placeholder="Toate categoriile"
          aria-label="Categorie"
          clearable
          data={options}
          value={filters.categoryId === null ? null : String(filters.categoryId)}
          onChange={(value) => {
            onChange({ categoryId: value === null ? null : Number(value) });
          }}
        />
        <TagsInput
          placeholder="Tag-uri (Enter după fiecare)"
          aria-label="Tag-uri"
          clearable
          value={filters.tags}
          onChange={(tags) => {
            onChange({ tags });
          }}
        />
      </SimpleGrid>
      <Group mt="sm" justify="space-between">
        <StatusChips
          value={filters.statuses}
          onChange={(statuses) => {
            onChange({ statuses });
          }}
        />
        {hasFilters && (
          <Button
            variant="subtle"
            size="xs"
            onClick={() => {
              setSearch('');
              onReset();
            }}
          >
            Șterge filtrele
          </Button>
        )}
      </Group>
    </Card>
  );
}

interface StatusChipsProps {
  value: ResourceStatus[];
  onChange: (value: ResourceStatus[]) => void;
}

/** Stările resursei, ca insigne colorate care se pot bifa împreună. */
function StatusChips({ value, onChange }: StatusChipsProps): React.JSX.Element {
  return (
    <Chip.Group multiple value={value} onChange={onChange}>
      <Group gap="xs" role="group" aria-label="Starea resursei">
        {STATUSES.map((status) => (
          <Chip key={status} value={status} color={STATUS_BADGES[status].color} size="sm">
            {STATUS_BADGES[status].label}
          </Chip>
        ))}
      </Group>
    </Chip.Group>
  );
}
