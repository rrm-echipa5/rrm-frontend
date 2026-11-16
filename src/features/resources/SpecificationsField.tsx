import { ActionIcon, Button, Group, Input, Stack, TextInput } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import {
  type Control,
  type FieldErrors,
  useFieldArray,
  type UseFormRegister,
} from 'react-hook-form';

import type { ResourceFormValues } from './resourceForm';

interface SpecificationsFieldProps {
  control: Control<ResourceFormValues>;
  register: UseFormRegister<ResourceFormValues>;
  errors: FieldErrors<ResourceFormValues>;
}

/** Specificațiile tehnice ale resursei, ca listă de perechi denumire - valoare. */
export function SpecificationsField({
  control,
  register,
  errors,
}: SpecificationsFieldProps): React.JSX.Element {
  const { fields, append, remove } = useFieldArray({ control, name: 'specifications' });

  return (
    <Input.Wrapper label="Specificații tehnice" error={errors.specifications?.root?.message}>
      <Stack gap="xs" mt={4}>
        {fields.map((field, index) => (
          <Group key={field.id} gap="xs" align="flex-start" wrap="nowrap">
            <TextInput
              placeholder="Denumire (ex. Rezoluție)"
              aria-label={`Denumirea specificației ${String(index + 1)}`}
              style={{ flex: 1 }}
              error={errors.specifications?.[index]?.name?.message}
              {...register(`specifications.${index}.name`)}
            />
            <TextInput
              placeholder="Valoare (ex. 1,2 nm la 30 kV)"
              aria-label={`Valoarea specificației ${String(index + 1)}`}
              style={{ flex: 2 }}
              error={errors.specifications?.[index]?.value?.message}
              {...register(`specifications.${index}.value`)}
            />
            <ActionIcon
              variant="subtle"
              color="red"
              mt={4}
              aria-label={`Șterge specificația ${String(index + 1)}`}
              onClick={() => {
                remove(index);
              }}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
        ))}
        <Button
          variant="light"
          size="xs"
          leftSection={<IconPlus size={14} />}
          style={{ alignSelf: 'flex-start' }}
          onClick={() => {
            append({ name: '', value: '' });
          }}
        >
          Adaugă specificație
        </Button>
      </Stack>
    </Input.Wrapper>
  );
}
