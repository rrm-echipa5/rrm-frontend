import { notifications } from '@mantine/notifications';
import type { SyntheticEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { ApiError } from '../../api/client';
import type { ResourceDetail } from '../../api/types';
import { errorMessage, type ResourceFormValues, toFormField, toWriteRequest } from './resourceForm';
import { useSaveResource } from './useResources';

interface ResourceFormSubmit {
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
  isSaving: boolean;
}

/**
 * Trimite formularul la API (`POST` la adăugare, `PUT` la modificare).
 *
 * Erorile de validare de la server apar lângă câmpurile lor; restul apar deasupra formularului.
 */
export function useResourceFormSubmit(
  form: UseFormReturn<ResourceFormValues>,
  resource: ResourceDetail | null,
  onDone: () => void,
): ResourceFormSubmit {
  const save = useSaveResource(resource?.id ?? null);

  const showServerErrors = (error: ApiError): void => {
    const unmatched = error.fieldErrors.filter((fieldError) => {
      const field = toFormField(fieldError.field);
      if (field !== null) {
        form.setError(field, { message: fieldError.message });
      }
      return field === null;
    });
    if (error.fieldErrors.length === 0 || unmatched.length > 0) {
      form.setError('root', { message: errorMessage(error) });
    }
  };

  const submit = form.handleSubmit((values) => {
    save.mutate(toWriteRequest(values), {
      onSuccess: (saved) => {
        const action = resource ? 'modificată' : 'adăugată';
        notifications.show({
          color: 'green',
          message: `Resursa „${saved.name}” a fost ${action}.`,
        });
        onDone();
      },
      onError: showServerErrors,
    });
  });

  return {
    onSubmit: (event) => {
      void submit(event);
    },
    isSaving: save.isPending,
  };
}
