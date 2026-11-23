import { apiRequest } from '../../api/client';
import type {
  Certification,
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
  /** Doar resursele cu aceste stări (`status`, repetat). */
  statuses?: string[];
  /** Doar resursele care au toate aceste tag-uri (`tag`, repetat). */
  tags?: string[];
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
  for (const status of params.statuses ?? []) {
    query.append('status', status);
  }
  for (const tag of params.tags ?? []) {
    query.append('tag', tag);
  }
  return apiRequest<ResourceSummaryPage>(`/resources?${query.toString()}`);
}

/** Parametrii căutării resurselor libere (`GET /api/resources/available`). */
export interface AvailableResourceParams extends Omit<ResourceListParams, 'statuses'> {
  /** Începutul intervalului (inclus), ISO 8601. */
  start: string;
  /** Sfârșitul intervalului (exclus), ISO 8601. */
  end: string;
}

/** `GET /api/resources/available`: resursele fără rezervări sau mentenanță în interval. */
export function listAvailableResources(
  params: AvailableResourceParams,
): Promise<ResourceSummaryPage> {
  const query = new URLSearchParams({
    start: params.start,
    end: params.end,
    page: String(params.page),
    size: String(params.size),
  });
  if (params.q) {
    query.set('q', params.q);
  }
  if (params.categoryId !== undefined) {
    query.set('categoryId', String(params.categoryId));
  }
  for (const tag of params.tags ?? []) {
    query.append('tag', tag);
  }
  return apiRequest<ResourceSummaryPage>(`/resources/available?${query.toString()}`);
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

/** `GET /api/users/me/certifications` */
export function listMyCertifications(): Promise<Certification[]> {
  return apiRequest<Certification[]>('/users/me/certifications');
}
