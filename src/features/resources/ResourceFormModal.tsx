import { Alert, Center, Loader, Modal } from '@mantine/core';

import { ResourceForm } from './ResourceForm';
import { errorMessage } from './resourceForm';
import { useResourceDetail } from './useResources';

interface ResourceFormModalProps {
  opened: boolean;
  /** Id-ul resursei modificate; `null` la adăugare. */
  resourceId: number | null;
  onClose: () => void;
}

/** Fereastra cu formularul fișei; la modificare încarcă întâi fișa din API. */
export function ResourceFormModal({
  opened,
  resourceId,
  onClose,
}: ResourceFormModalProps): React.JSX.Element {
  const detail = useResourceDetail(opened ? resourceId : null);
  const isEdit = resourceId !== null;

  const renderBody = (): React.JSX.Element => {
    if (!isEdit) {
      return <ResourceForm resource={null} onDone={onClose} />;
    }
    if (detail.isError) {
      return <Alert color="red">{errorMessage(detail.error)}</Alert>;
    }
    if (detail.isPending) {
      return (
        <Center py="xl">
          <Loader />
        </Center>
      );
    }
    return <ResourceForm key={detail.data.updatedAt} resource={detail.data} onDone={onClose} />;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Modifică fișa resursei' : 'Adaugă o resursă'}
      size="lg"
    >
      {opened && renderBody()}
    </Modal>
  );
}
