// Tipurile JSON din contractul API (rrm-api.yaml). Numele câmpurilor sunt cele din API (camelCase).

/** Eroarea de validare a unui câmp (`FieldError`). */
export interface FieldError {
  field: string;
  message: string;
}

/** Corpul unei erori `application/problem+json` (`Problem`, RFC 9457). */
export interface Problem {
  type?: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  instance?: string;
  timestamp?: string;
  errors?: FieldError[];
}

/** Răspunsul `GET /api/health`. */
export interface HealthStatus {
  status: 'ok';
  database: 'ok' | 'unavailable';
}

/** Enumerarea `StareResursă`. */
export type ResourceStatus = 'ACTIVE' | 'MAINTENANCE' | 'FAULTY';

/** Enumerarea `FluxAprobare`. */
export type ApprovalFlow = 'AUTO' | 'COORDINATOR' | 'COORDINATOR_AND_ADMIN';

/** Codurile categoriilor de resurse (enumerarea `CategorieResursă`). */
export type CategoryCode = 'HARDWARE' | 'HPC' | 'ROOM' | 'MEASUREMENT_INSTRUMENT';

/** O categorie de resurse (`ResourceCategory`). */
export interface ResourceCategory {
  id: number;
  code: CategoryCode;
  name: string;
}

/** Referința la categoria unei resurse (`CategoryRef`). */
export interface CategoryRef {
  id: number;
  name: string;
}

/** Referința la un utilizator (`UserRef`). */
export interface UserRef {
  id: number;
  name: string;
  email?: string | null;
}

/** Resursa, așa cum apare în catalog (`ResourceSummary`). */
export interface ResourceSummary {
  id: number;
  name: string;
  category: CategoryRef;
  location: string | null;
  status: ResourceStatus;
  approvalFlow: ApprovalFlow;
  tags: string[];
}

/** Fișa resursei (`ResourceDetail`). */
export interface ResourceDetail extends ResourceSummary {
  description: string | null;
  specifications: Record<string, string>;
  administrator: UserRef;
  checkInQrCode: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Datele de paginare (`PageMeta`). */
export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** O pagină din catalog (`ResourceSummaryPage`). */
export interface ResourceSummaryPage {
  content: ResourceSummary[];
  page: PageMeta;
}

/** Datele fișei resursei, la creare și la modificare (`ResourceWriteRequest`). */
export interface ResourceWriteRequest {
  name: string;
  categoryId: number;
  location?: string;
  description?: string;
  specifications: Record<string, string>;
  tags: string[];
  approvalFlow: ApprovalFlow;
  administratorId?: number;
}
