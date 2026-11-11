import type { ApprovalFlow, ResourceStatus } from '../../api/types';

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
