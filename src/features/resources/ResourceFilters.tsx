import { Group, Select, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import { useResourceCategories } from './useResources';

interface ResourceFiltersProps {
  search: string;
  categoryId: string | null;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string | null) => void;
}

/** Căutarea în catalog și filtrul pe categorie. */
export function ResourceFilters({
  search,
  categoryId,
  onSearchChange,
  onCategoryChange,
}: ResourceFiltersProps): React.JSX.Element {
  const categories = useResourceCategories();
  const options = (categories.data ?? []).map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <Group grow>
      <TextInput
        placeholder="Caută după denumire, locație sau specificații"
        aria-label="Caută resurse"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(event) => {
          onSearchChange(event.currentTarget.value);
        }}
      />
      <Select
        placeholder="Toate categoriile"
        aria-label="Categorie"
        clearable
        data={options}
        value={categoryId}
        onChange={onCategoryChange}
      />
    </Group>
  );
}
