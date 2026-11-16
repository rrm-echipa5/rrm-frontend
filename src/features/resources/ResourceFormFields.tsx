import { Select, TagsInput, Textarea, TextInput } from '@mantine/core';
import { Controller, type UseFormReturn } from 'react-hook-form';

import type { ResourceCategory } from '../../api/types';
import type { ResourceFormValues } from './resourceForm';
import { APPROVAL_FLOW_LABELS } from './resourceLabels';
import { SpecificationsField } from './SpecificationsField';

const APPROVAL_FLOW_OPTIONS = Object.entries(APPROVAL_FLOW_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface ResourceFormFieldsProps {
  form: UseFormReturn<ResourceFormValues>;
  categories: ResourceCategory[];
}

/** Câmpurile fișei resursei: denumire, categorie, locație, descriere, specificații, tag-uri, flux. */
export function ResourceFormFields({
  form,
  categories,
}: ResourceFormFieldsProps): React.JSX.Element {
  const { errors } = form.formState;
  const categoryOptions = categories.map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <>
      <TextInput
        label="Denumire"
        required
        error={errors.name?.message}
        {...form.register('name')}
      />
      <Controller
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <Select
            label="Categorie"
            required
            placeholder="Alege categoria"
            data={categoryOptions}
            value={field.value || null}
            onChange={(value) => {
              field.onChange(value ?? '');
            }}
            error={errors.categoryId?.message}
          />
        )}
      />
      <TextInput label="Locație" error={errors.location?.message} {...form.register('location')} />
      <Textarea
        label="Descriere"
        autosize
        minRows={2}
        error={errors.description?.message}
        {...form.register('description')}
      />
      <SpecificationsField control={form.control} register={form.register} errors={errors} />
      <Controller
        control={form.control}
        name="tags"
        render={({ field }) => (
          <TagsInput
            label="Tag-uri"
            placeholder="Scrie un tag și apasă Enter"
            value={field.value}
            onChange={field.onChange}
            error={errors.tags?.message ?? errors.tags?.[0]?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="approvalFlow"
        render={({ field }) => (
          <Select
            label="Flux de aprobare"
            required
            allowDeselect={false}
            data={APPROVAL_FLOW_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            error={errors.approvalFlow?.message}
          />
        )}
      />
    </>
  );
}
