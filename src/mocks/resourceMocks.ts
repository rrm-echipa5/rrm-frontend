import type {
  Certification,
  MaintenanceBlock,
  ResourceDetail,
  ResourceStatus,
  ResourceSummary,
  ResourceSummaryPage,
} from '../api/types';
import { allResources, currentUser, findResource, resourceTimestamps, userRef } from './mockDb';
import { SEED_CATEGORIES, SEED_LOADED_AT, type SeedResource } from './seedData';
import {
  certificationStatus,
  SEED_CERTIFICATIONS,
  SEED_FILES,
  SEED_MAINTENANCE,
  type SeedMaintenance,
} from './seedRecords';

/** Filtrele catalogului, cu aceleași reguli ca în backend (KAN-87). */
export interface CatalogQuery {
  categoryId: number | null;
  statuses: string[];
  q: string;
  tags: string[];
  page: number;
  size: number;
  sort: string;
}

const SORTABLE_FIELDS = ['id', 'name', 'location', 'status'] as const;
type SortField = (typeof SORTABLE_FIELDS)[number];

function categoryRef(categoryId: number): { id: number; name: string } {
  const category = SEED_CATEGORIES.find((candidate) => candidate.id === categoryId);
  return { id: categoryId, name: category?.name ?? '' };
}

/** O blocare care nu s-a încheiat și nu a fost anulată, cu starea ei la momentul `now`. */
function liveStatus(block: SeedMaintenance, now: Date): 'SCHEDULED' | 'ACTIVE' | null {
  if (block.status === 'ENDED' || block.status === 'CANCELLED') {
    return null;
  }
  if (block.end !== null && new Date(block.end) <= now) {
    return null;
  }
  return new Date(block.start) <= now ? 'ACTIVE' : 'SCHEDULED';
}

/** Mentenanța în curs sau următoarea programată (`currentOrNextMaintenance`). */
function currentOrNextMaintenance(resource: SeedResource, now: Date): MaintenanceBlock | null {
  const upcoming = SEED_MAINTENANCE.filter(
    (block) => block.resourceId === resource.id && liveStatus(block, now) !== null,
  ).sort((a, b) => a.start.localeCompare(b.start));
  const block = upcoming[0];
  const status = block === undefined ? null : liveStatus(block, now);
  if (block === undefined || status === null) {
    return null;
  }
  return {
    id: block.id,
    resource: { id: resource.id, name: resource.name },
    workType: block.workType,
    start: block.start,
    end: block.end,
    reason: block.reason,
    status,
    createdBy: userRef(resource.administratorId),
    createdAt: block.createdAt,
    endedAt: block.endedAt,
    cancelledReservationsCount: block.cancelledReservationsCount,
  };
}

/** Starea resursei: blocarea în curs o trece în `MAINTENANCE`, ca endpoint-urile de mentenanță. */
function resourceStatus(resource: SeedResource, now: Date): ResourceStatus {
  return currentOrNextMaintenance(resource, now)?.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
}

function isCertified(resourceId: number, now: Date): boolean {
  return SEED_CERTIFICATIONS.some(
    (cert) =>
      cert.userId === currentUser().id &&
      cert.resourceId === resourceId &&
      certificationStatus(cert, now) === 'ACTIVE',
  );
}

function toSummary(resource: SeedResource, now: Date): ResourceSummary {
  return {
    id: resource.id,
    name: resource.name,
    category: categoryRef(resource.categoryId),
    location: resource.location,
    status: resourceStatus(resource, now),
    approvalFlow: resource.approvalFlow,
    tags: resource.tags,
    requiredCertificationLevel: resource.rule.requiredCertificationLevel,
    userCertified: isCertified(resource.id, now),
  };
}

function matches(summary: ResourceSummary, resource: SeedResource, query: CatalogQuery): boolean {
  const text = query.q.trim().toLocaleLowerCase('ro');
  const searchable = [resource.name, resource.location, JSON.stringify(resource.specifications)];
  return (
    (query.categoryId === null || resource.categoryId === query.categoryId) &&
    (query.statuses.length === 0 || query.statuses.includes(summary.status)) &&
    (text === '' || searchable.some((value) => value.toLocaleLowerCase('ro').includes(text))) &&
    query.tags.every((tag) => resource.tags.includes(tag))
  );
}

function compareBy(sort: string): (a: ResourceSummary, b: ResourceSummary) => number {
  const [rawField, direction] = sort.split(',');
  const field: SortField = SORTABLE_FIELDS.find((name) => name === rawField) ?? 'name';
  const sign = direction === 'desc' ? -1 : 1;
  return (a, b) => {
    const result = String(a[field] ?? '').localeCompare(String(b[field] ?? ''), 'ro', {
      numeric: true,
    });
    return result === 0 ? a.id - b.id : sign * result;
  };
}

/**
 * `GET /resources`: catalogul filtrat, sortat și paginat. `include` mai restrânge resursele (de
 * exemplu, doar cele libere într-un interval, pentru `GET /resources/available`).
 */
export function catalogPage(
  query: CatalogQuery,
  now: Date,
  include: (resource: SeedResource) => boolean = () => true,
): ResourceSummaryPage {
  const items = allResources()
    .filter(include)
    .map((resource) => ({ resource, summary: toSummary(resource, now) }))
    .filter(({ resource, summary }) => matches(summary, resource, query))
    .map(({ summary }) => summary)
    .sort(compareBy(query.sort));
  const start = query.page * query.size;
  return {
    content: items.slice(start, start + query.size),
    page: {
      page: query.page,
      size: query.size,
      totalElements: items.length,
      totalPages: Math.ceil(items.length / query.size),
    },
  };
}

/** `GET /resources/{resourceId}`: fișa resursei, sau `null` dacă nu există. */
export function resourceDetail(resourceId: number, now: Date): ResourceDetail | null {
  const resource = findResource(resourceId);
  if (resource === undefined) {
    return null;
  }
  const { createdAt, updatedAt } = resourceTimestamps(resource.id);
  return {
    ...toSummary(resource, now),
    description: resource.description,
    specifications: resource.specifications,
    administrator: userRef(resource.administratorId),
    usageRule: {
      ...resource.rule,
      approvalFlow: resource.approvalFlow,
      updatedAt: SEED_LOADED_AT,
      updatedBy: userRef(resource.administratorId),
    },
    files: SEED_FILES.filter((file) => file.resourceId === resource.id).map((file) => ({
      id: file.id,
      type: file.type,
      title: file.title,
      fileName: file.fileName,
      contentType: file.contentType,
      sizeBytes: file.sizeBytes,
      url: `/api/resources/${String(resource.id)}/files/${String(file.id)}`,
      uploadedAt: SEED_LOADED_AT,
    })),
    currentOrNextMaintenance: currentOrNextMaintenance(resource, now),
    // Codul QR de check-in este vizibil doar pentru administratorul resursei.
    checkInQrCode: resource.administratorId === currentUser().id ? resource.checkInQrCode : null,
    createdAt: createdAt ?? SEED_LOADED_AT,
    updatedAt: updatedAt ?? SEED_LOADED_AT,
  };
}

/** `GET /users/me/certifications`: certificările utilizatorului curent. */
export function myCertifications(now: Date): Certification[] {
  return SEED_CERTIFICATIONS.filter((cert) => cert.userId === currentUser().id).map((cert) => {
    const resource = findResource(cert.resourceId);
    return {
      id: cert.id,
      user: userRef(cert.userId),
      resource: { id: cert.resourceId, name: resource?.name ?? '' },
      level: cert.level,
      status: certificationStatus(cert, now),
      grantedAt: cert.grantedAt,
      grantedBy: userRef(cert.grantedById),
      expiresAt: cert.expiresAt,
      revokedAt: cert.revokedAt,
      revokeReason: cert.revokeReason,
    };
  });
}
