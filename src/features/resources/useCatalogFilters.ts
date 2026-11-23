import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import type { ResourceStatus } from '../../api/types';
import { STATUS_BADGES } from './resourceLabels';

/** Filtrele catalogului, așa cum apar în adresa paginii. */
export interface CatalogFilters {
  q: string;
  categoryId: number | null;
  statuses: ResourceStatus[];
  tags: string[];
  /** Intervalul în care resursa trebuie să fie liberă (ISO 8601); `null` pentru tot catalogul. */
  interval: { start: string; end: string } | null;
  /** Pagina curentă, numerotată de la 1 (în API, `page` pornește de la 0). */
  page: number;
}

/** Modificările care se pot face filtrelor; orice filtru schimbat întoarce la prima pagină. */
export type CatalogFiltersUpdate = Partial<Omit<CatalogFilters, 'page'>>;

function isResourceStatus(value: string): value is ResourceStatus {
  return value in STATUS_BADGES;
}

function readInterval(params: URLSearchParams): CatalogFilters['interval'] {
  const start = params.get('start');
  const end = params.get('end');
  if (start === null || end === null) {
    return null;
  }
  const valid = !Number.isNaN(Date.parse(start)) && Date.parse(end) > Date.parse(start);
  return valid ? { start, end } : null;
}

function readFilters(params: URLSearchParams): CatalogFilters {
  const categoryId = Number(params.get('categoryId'));
  const page = Number(params.get('page'));
  return {
    interval: readInterval(params),
    q: params.get('q') ?? '',
    categoryId: Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null,
    statuses: params.getAll('status').filter(isResourceStatus),
    tags: params.getAll('tag'),
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

function writeFilters(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q !== '') {
    params.set('q', filters.q);
  }
  if (filters.categoryId !== null) {
    params.set('categoryId', String(filters.categoryId));
  }
  filters.statuses.forEach((status) => {
    params.append('status', status);
  });
  filters.tags.forEach((tag) => {
    params.append('tag', tag);
  });
  if (filters.interval !== null) {
    params.set('start', filters.interval.start);
    params.set('end', filters.interval.end);
  }
  if (filters.page > 1) {
    params.set('page', String(filters.page));
  }
  return params;
}

/**
 * Filtrele catalogului păstrate în adresa paginii, ca o căutare să poată fi trimisă cuiva și ca
 * butonul „Înapoi” din fișa resursei să revină la aceeași listă.
 */
export function useCatalogFilters(): {
  filters: CatalogFilters;
  update: (changes: CatalogFiltersUpdate) => void;
  setPage: (page: number) => void;
  reset: () => void;
} {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);

  const update = useCallback(
    (changes: CatalogFiltersUpdate) => {
      setParams((current) => writeFilters({ ...readFilters(current), ...changes, page: 1 }), {
        replace: true,
      });
    },
    [setParams],
  );
  const setPage = useCallback(
    (page: number) => {
      setParams((current) => writeFilters({ ...readFilters(current), page }));
    },
    [setParams],
  );
  const reset = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
  }, [setParams]);

  return { filters, update, setPage, reset };
}
