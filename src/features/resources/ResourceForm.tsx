import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Group, Stack } from '@mantine/core';
import { useForm } from 'react-hook-form';

import type { ResourceDetail } from '../../api/types';
import {
  EMPTY_FORM,
  resourceFormSchema,
  type ResourceFormValues,
  toFormValues,
} from './resourceForm';
import { ResourceFormFields } from './ResourceFormFields';
import { useResourceFormSubmit } from './useResourceFormSubmit';
import { useResourceCategories } from './useResources';

interface ResourceFormProps {
  /** Resursa modificată; `null` la adăugare. */
  resource: ResourceDetail | null;
  onDone: () => void;
}

/** Formularul fișei resursei, folosit la adăugare și la modificare. */
export function ResourceForm({ resource, onDone }: ResourceFormProps): React.JSX.Element {
  const categories = useResourceCategories();
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: resource ? toFormValues(resource) : EMPTY_FORM,
  });
  const { onSubmit, isSaving } = useResourceFormSubmit(form, resource, onDone);
  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack gap="sm">
        {rootError && <Alert color="red">{rootError}</Alert>}
        <ResourceFormFields form={form} categories={categories.data ?? []} />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onDone}>
            Renunță
          </Button>
          <Button type="submit" loading={isSaving}>
            {resource ? 'Salvează modificările' : 'Adaugă resursa'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
