import {
  keepPreviousData,
  useMutation,
  type UseMutationResult,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { ApiError } from '../../api/client';
import type {
  ResourceCategory,
  ResourceDetail,
  ResourceSummaryPage,
  ResourceWriteRequest,
} from '../../api/types';
import {
  createResource,
  deleteResource,
  getResource,
  listResourceCategories,
  listResources,
  type ResourceListParams,
  updateResource,
} from './resourcesApi';

const RESOURCES_KEY = ['resources'] as const;

/** Categoriile de resurse; se schimbă rar, deci rămân în cache toată sesiunea. */
export function useResourceCategories(): UseQueryResult<ResourceCategory[], ApiError> {
  return useQuery<ResourceCategory[], ApiError>({
    queryKey: ['resource-categories'],
    queryFn: listResourceCategories,
    staleTime: Infinity,
  });
}

/** O pagină din catalog; pagina anterioară rămâne afișată cât se încarcă următoarea. */
export function useResourceList(
  params: ResourceListParams,
): UseQueryResult<ResourceSummaryPage, ApiError> {
  return useQuery<ResourceSummaryPage, ApiError>({
    queryKey: [...RESOURCES_KEY, 'list', params],
    queryFn: () => listResources(params),
    placeholderData: keepPreviousData,
  });
}

/** Fișa unei resurse, încărcată doar când există un id (la modificare). */
export function useResourceDetail(
  resourceId: number | null,
): UseQueryResult<ResourceDetail, ApiError> {
  return useQuery<ResourceDetail, ApiError>({
    queryKey: [...RESOURCES_KEY, 'detail', resourceId],
    queryFn: () => getResource(resourceId ?? 0),
    enabled: resourceId !== null,
  });
}

/** Adaugă sau modifică o resursă, apoi reîncarcă lista din API. */
export function useSaveResource(
  resourceId: number | null,
): UseMutationResult<ResourceDetail, ApiError, ResourceWriteRequest> {
  const queryClient = useQueryClient();
  return useMutation<ResourceDetail, ApiError, ResourceWriteRequest>({
    mutationFn: (body) =>
      resourceId === null ? createResource(body) : updateResource(resourceId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESOURCES_KEY }),
  });
}

/** Scoate o resursă din catalog, apoi reîncarcă lista din API. */
export function useDeleteResource(): UseMutationResult<undefined, ApiError, number> {
  const queryClient = useQueryClient();
  return useMutation<undefined, ApiError, number>({
    mutationFn: deleteResource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESOURCES_KEY }),
  });
}
