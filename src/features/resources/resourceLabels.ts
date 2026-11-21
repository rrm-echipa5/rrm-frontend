import type { ApprovalFlow, CertificationStatus, ResourceStatus, WorkType } from '../../api/types';

/** Textul și culoarea insignei pentru fiecare stare a resursei. */
export const STATUS_BADGES: Record<ResourceStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Activă', color: 'green' },
  MAINTENANCE: { label: 'În mentenanță', color: 'orange' },
  FAULTY: { label: 'Defectă', color: 'red' },
};

/** Denumirile fluxurilor de aprobare, ca în prototipuri. */
export const APPROVAL_FLOW_LABELS: Record<ApprovalFlow, string> = {
  AUTO: 'Auto-aprobare',
  COORDINATOR: 'Coordonator',
  COORDINATOR_AND_ADMIN: 'Coordonator și administrator',
};

/** Denumirile tipurilor de lucrări de mentenanță (`TipLucrare`). */
export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  MAINTENANCE: 'Mentenanță',
  CALIBRATION: 'Calibrare',
};

/** Textul și culoarea insignei pentru fiecare stare a certificării. */
export const CERTIFICATION_BADGES: Record<CertificationStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Validă', color: 'green' },
  EXPIRED: { label: 'Expirată', color: 'gray' },
  REVOKED: { label: 'Retrasă', color: 'red' },
};

/** Etapele de aprobare ale fiecărui flux, în ordinea în care se parcurg. */
export const APPROVAL_FLOW_STEPS: Record<ApprovalFlow, string[]> = {
  AUTO: ['Auto-aprobare'],
  COORDINATOR: ['Coordonator'],
  COORDINATOR_AND_ADMIN: ['Coordonator', 'Administrator Resursă'],
};
