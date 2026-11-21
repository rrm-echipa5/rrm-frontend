import { z } from 'zod';

import type { ApiError } from '../../api/client';
import type { ResourceDetail, ResourceWriteRequest } from '../../api/types';

/** Regulile de validare ale formularului, cu aceleași limite ca în `rrm-api.yaml`. */
export const resourceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Denumirea trebuie să aibă cel puțin 2 caractere.')
    .max(150, 'Denumirea poate avea cel mult 150 de caractere.'),
  categoryId: z.string().min(1, 'Alege categoria.'),
  location: z.string().trim().max(200, 'Locația poate avea cel mult 200 de caractere.'),
  description: z.string().max(4000, 'Descrierea poate avea cel mult 4000 de caractere.'),
  specifications: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Completează denumirea.'),
        value: z
          .string()
          .trim()
          .min(1, 'Completează valoarea.')
          .max(500, 'Valoarea poate avea cel mult 500 de caractere.'),
      }),
    )
    .refine(
      (items) => new Set(items.map((item) => item.name)).size === items.length,
      'Două specificații nu pot avea aceeași denumire.',
    ),
  tags: z
    .array(z.string().max(40, 'Un tag poate avea cel mult 40 de caractere.'))
    .max(20, 'Cel mult 20 de tag-uri.'),
  approvalFlow: z.enum(['AUTO', 'COORDINATOR', 'COORDINATOR_AND_ADMIN']),
});

export type ResourceFormValues = z.infer<typeof resourceFormSchema>;

/** Câmpurile formularului pe care se pot afișa erorile primite de la server. */
export const FORM_FIELDS = [
  'name',
  'categoryId',
  'location',
  'description',
  'specifications',
  'tags',
  'approvalFlow',
] as const satisfies readonly (keyof ResourceFormValues)[];

export const EMPTY_FORM: ResourceFormValues = {
  name: '',
  categoryId: '',
  location: '',
  description: '',
  specifications: [],
  tags: [],
  approvalFlow: 'COORDINATOR',
};

/** Valorile formularului pentru o resursă existentă. */
export function toFormValues(resource: ResourceDetail): ResourceFormValues {
  return {
    name: resource.name,
    categoryId: String(resource.category.id),
    location: resource.location ?? '',
    description: resource.description ?? '',
    specifications: Object.entries(resource.specifications).map(([name, value]) => ({
      name,
      value,
    })),
    tags: resource.tags,
    approvalFlow: resource.approvalFlow,
  };
}

/** Corpul cererii `POST`/`PUT /api/resources` din valorile formularului. */
export function toWriteRequest(values: ResourceFormValues): ResourceWriteRequest {
  const request: ResourceWriteRequest = {
    name: values.name,
    categoryId: Number(values.categoryId),
    specifications: Object.fromEntries(values.specifications.map((s) => [s.name, s.value])),
    tags: values.tags,
    approvalFlow: values.approvalFlow,
  };
  if (values.location) {
    request.location = values.location;
  }
  if (values.description) {
    request.description = values.description;
  }
  return request;
}

/** Câmpul din formular corespunzător unei erori de validare de la server (`tags.0` -> `tags`). */
export function toFormField(apiField: string): (typeof FORM_FIELDS)[number] | null {
  const base = apiField.split('.')[0];
  return FORM_FIELDS.find((field) => field === base) ?? null;
}

/** Mesajul pentru utilizator dintr-o eroare a API-ului. */
export function errorMessage(error: ApiError | Error): string {
  return error.message || 'A apărut o eroare neașteptată.';
}
