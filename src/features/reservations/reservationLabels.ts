import type { ApprovalStage, ReservationStatus } from '../../api/types';

/**
 * Textul și culoarea insignei pentru fiecare status, ca în prototip. Pentru solicitant, ambele etape
 * de aprobare apar ca „În așteptare” (diagrama de stări 7.1); etapa se vede în istoricul cererii.
 */
export const RESERVATION_STATUS_BADGES: Record<
  ReservationStatus,
  { label: string; color: string }
> = {
  PENDING: { label: 'În așteptare', color: 'yellow' },
  PENDING_ADMIN: { label: 'În așteptare', color: 'yellow' },
  CONFIRMED: { label: 'Confirmată', color: 'green' },
  IN_PROGRESS: { label: 'În desfășurare', color: 'blue' },
  COMPLETED: { label: 'Finalizată', color: 'gray' },
  REJECTED: { label: 'Respinsă', color: 'red' },
  CANCELLED: { label: 'Anulată', color: 'red' },
  AUTO_CANCELLED: { label: 'Anulată automat', color: 'red' },
};

/** Statusurile din care se poate anula (extensia „Anulare rezervare”). */
export const CANCELLABLE_STATUSES: readonly ReservationStatus[] = [
  'PENDING',
  'PENDING_ADMIN',
  'CONFIRMED',
];

/** Filtrele listei, ca în prototip: toate, cele active și istoricul. */
export type ReservationTab = 'all' | 'active' | 'history';

/** Filtrele listei, cu statusurile trimise la API (`status`, repetat). */
export const RESERVATION_TABS: {
  value: ReservationTab;
  label: string;
  statuses?: readonly ReservationStatus[];
}[] = [
  { value: 'all', label: 'Toate' },
  {
    value: 'active',
    label: 'Active',
    statuses: ['PENDING', 'PENDING_ADMIN', 'CONFIRMED', 'IN_PROGRESS'],
  },
  {
    value: 'history',
    label: 'Istoric',
    statuses: ['COMPLETED', 'REJECTED', 'CANCELLED', 'AUTO_CANCELLED'],
  },
];

/** Cine decide în fiecare etapă de aprobare. */
export const APPROVAL_STAGE_LABELS: Record<ApprovalStage, string> = {
  COORDINATOR: 'coordonatorul echipei',
  RESOURCE_ADMIN: 'administratorul resursei',
};
