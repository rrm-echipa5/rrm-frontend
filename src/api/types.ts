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

/** Referința la o resursă (`ResourceRef`). */
export interface ResourceRef {
  id: number;
  name: string;
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
  /** Nivelul de certificare cerut; `null` dacă resursa nu cere certificare. */
  requiredCertificationLevel?: number | null;
  /** Dacă utilizatorul curent are o certificare valabilă pentru resursă. */
  userCertified?: boolean;
}

/** Regulile de utilizare ale resursei (`UsageRule`, cu `UsageRuleSummary`). */
export interface UsageRule {
  minDurationMinutes: number;
  maxDurationMinutes: number;
  breakBetweenMinutes: number;
  checkInDeadlineMinutes: number;
  requiredCertificationLevel?: number | null;
  approvalFlow: ApprovalFlow;
  updatedAt?: string;
  updatedBy?: UserRef;
}

/** Tipul unui fișier al resursei (`ResourceFileType`). */
export type ResourceFileType = 'MANUAL' | 'PHOTO';

/** Un manual PDF sau o poză a resursei (`ResourceFile`). */
export interface ResourceFile {
  id: number;
  type: ResourceFileType;
  title: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  uploadedAt: string;
}

/** Enumerarea `TipLucrare` (`WorkType`). */
export type WorkType = 'MAINTENANCE' | 'CALIBRATION';

/** Starea unei blocări pentru mentenanță (`MaintenanceStatus`). */
export type MaintenanceStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';

/** O blocare pentru mentenanță sau calibrare (`MaintenanceBlock`). */
export interface MaintenanceBlock {
  id: number;
  resource: ResourceRef;
  workType: WorkType;
  start: string;
  /** `null` pentru durată nedeterminată. */
  end?: string | null;
  reason?: string;
  status: MaintenanceStatus;
  createdBy: UserRef;
  createdAt: string;
  endedAt?: string | null;
  cancelledReservationsCount?: number;
}

/** Fișa resursei (`ResourceDetail`). */
export interface ResourceDetail extends ResourceSummary {
  description: string | null;
  specifications: Record<string, string>;
  administrator: UserRef;
  usageRule: UsageRule;
  files: ResourceFile[];
  /** Mentenanța în curs sau următoarea programată; `null` dacă nu există. */
  currentOrNextMaintenance?: MaintenanceBlock | null;
  checkInQrCode: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Starea unei certificări (`CertificationStatus`). */
export type CertificationStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

/** Certificarea unui utilizator pentru o resursă (`Certification`). */
export interface Certification {
  id: number;
  user: UserRef;
  resource: ResourceRef;
  level: number;
  status: CertificationStatus;
  grantedAt: string;
  grantedBy: UserRef;
  /** Data expirării (`YYYY-MM-DD`); `null` dacă certificarea nu expiră. */
  expiresAt?: string | null;
  revokedAt?: string | null;
  revokeReason?: string | null;
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
