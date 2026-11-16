import { apiRequest } from '../../api/client';
import type {
  ResourceCategory,
  ResourceDetail,
  ResourceSummaryPage,
  ResourceWriteRequest,
} from '../../api/types';

/** Parametrii catalogului (`GET /api/resources`). */
export interface ResourceListParams {
  page: number;
  size: number;
  q?: string;
  categoryId?: number;
}

/** `GET /api/resource-categories` */
export function listResourceCategories(): Promise<ResourceCategory[]> {
  return apiRequest<ResourceCategory[]>('/resource-categories');
}

/** `GET /api/resources` */
export function listResources(params: ResourceListParams): Promise<ResourceSummaryPage> {
  const query = new URLSearchParams({ page: String(params.page), size: String(params.size) });
  if (params.q) {
    query.set('q', params.q);
  }
  if (params.categoryId !== undefined) {
    query.set('categoryId', String(params.categoryId));
  }
  return apiRequest<ResourceSummaryPage>(`/resources?${query.toString()}`);
}

/** `GET /api/resources/{resourceId}` */
export function getResource(resourceId: number): Promise<ResourceDetail> {
  return apiRequest<ResourceDetail>(`/resources/${String(resourceId)}`);
}

/** `POST /api/resources` */
export function createResource(body: ResourceWriteRequest): Promise<ResourceDetail> {
  return apiRequest<ResourceDetail>('/resources', { method: 'POST', body: JSON.stringify(body) });
}

/** `PUT /api/resources/{resourceId}` */
export function updateResource(
  resourceId: number,
  body: ResourceWriteRequest,
): Promise<ResourceDetail> {
  return apiRequest<ResourceDetail>(`/resources/${String(resourceId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/** `DELETE /api/resources/{resourceId}` */
export function deleteResource(resourceId: number): Promise<undefined> {
  return apiRequest<undefined>(`/resources/${String(resourceId)}`, { method: 'DELETE' });
}
