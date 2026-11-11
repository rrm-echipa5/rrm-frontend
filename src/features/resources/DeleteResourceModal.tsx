import { Button, Group, Modal, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import type { ResourceSummary } from '../../api/types';
import { errorMessage } from './resourceForm';
import { useDeleteResource } from './useResources';

interface DeleteResourceModalProps {
  /** Resursa de șters; `null` când fereastra e închisă. */
  resource: ResourceSummary | null;
  onClose: () => void;
}

/** Confirmarea scoaterii unei resurse din catalog (`DELETE /api/resources/{id}`). */
export function DeleteResourceModal({
  resource,
  onClose,
}: DeleteResourceModalProps): React.JSX.Element {
  const remove = useDeleteResource();

  const confirm = (): void => {
    if (resource === null) {
      return;
    }
    remove.mutate(resource.id, {
      onSuccess: () => {
        notifications.show({
          color: 'green',
          message: `Resursa „${resource.name}” a fost scoasă din catalog.`,
        });
        onClose();
      },
      onError: (error) => {
        notifications.show({
          color: 'red',
          title: 'Nu s-a putut șterge',
          message: errorMessage(error),
        });
        onClose();
      },
    });
  };

  return (
    <Modal opened={resource !== null} onClose={onClose} title="Scoți resursa din catalog?">
      <Text>
        Resursa <b>{resource?.name}</b> nu va mai apărea în catalog. Rezervările trecute și
        istoricul ei rămân în aplicație.
      </Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          Renunță
        </Button>
        <Button color="red" loading={remove.isPending} onClick={confirm}>
          Șterge
        </Button>
      </Group>
    </Modal>
  );
}
