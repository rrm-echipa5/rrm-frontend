import { ActionIcon, Badge, Group, Table, Text, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';

import type { ResourceSummary } from '../../api/types';
import { APPROVAL_FLOW_LABELS, STATUS_BADGES } from './resourceLabels';

interface ResourcesTableProps {
  resources: ResourceSummary[];
  onEdit: (resource: ResourceSummary) => void;
  onDelete: (resource: ResourceSummary) => void;
}

/** Tabelul catalogului de resurse, cu acțiunile de modificare și ștergere pe fiecare rând. */
export function ResourcesTable({
  resources,
  onEdit,
  onDelete,
}: ResourcesTableProps): React.JSX.Element {
  const rows = resources.map((resource) => (
    <Table.Tr key={resource.id}>
      <Table.Td>
        <Text fw={500}>{resource.name}</Text>
      </Table.Td>
      <Table.Td>{resource.category.name}</Table.Td>
      <Table.Td>{resource.location ?? '-'}</Table.Td>
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        <Badge
          color={STATUS_BADGES[resource.status].color}
          variant="light"
          style={{ flexShrink: 0 }}
        >
          {STATUS_BADGES[resource.status].label}
        </Badge>
      </Table.Td>
      <Table.Td>{APPROVAL_FLOW_LABELS[resource.approvalFlow]}</Table.Td>
      <Table.Td>
        <Group gap={4}>
          {resource.tags.map((tag) => (
            <Badge key={tag} variant="outline" color="gray" size="sm" tt="none">
              {tag}
            </Badge>
          ))}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={4} wrap="nowrap" justify="flex-end">
          <Tooltip label="Modifică">
            <ActionIcon
              variant="subtle"
              aria-label={`Modifică ${resource.name}`}
              onClick={() => {
                onEdit(resource);
              }}
            >
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Scoate din catalog">
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label={`Șterge ${resource.name}`}
              onClick={() => {
                onDelete(resource);
              }}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table.ScrollContainer minWidth={900}>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Denumire</Table.Th>
            <Table.Th>Categorie</Table.Th>
            <Table.Th>Locație</Table.Th>
            <Table.Th miw={130}>Stare</Table.Th>
            <Table.Th>Flux de aprobare</Table.Th>
            <Table.Th>Tag-uri</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
