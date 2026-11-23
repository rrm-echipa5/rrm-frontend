import {
  keepPreviousData,
  useMutation,
  type UseMutationResult,
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { ApiError } from '../../api/client';
import type { Reservation, ReservationSummaryPage } from '../../api/types';
import { RESERVATION_TABS, type ReservationTab } from './reservationLabels';
import {
  cancelReservation,
  getReservation,
  listMyReservations,
  type MyReservationsParams,
} from './reservationsApi';

const RESERVATIONS_KEY = ['reservations'] as const;

/** O pagină din „Rezervările mele”; pagina anterioară rămâne afișată cât se încarcă următoarea. */
export function useMyReservations(
  params: MyReservationsParams,
): UseQueryResult<ReservationSummaryPage, ApiError> {
  return useQuery<ReservationSummaryPage, ApiError>({
    queryKey: [...RESERVATIONS_KEY, 'mine', params],
    queryFn: () => listMyReservations(params),
    placeholderData: keepPreviousData,
  });
}

/** Numărul de rezervări din fiecare filtru („Toate”, „Active”, „Istoric”), pentru etichete. */
export function useMyReservationCounts(): Partial<Record<ReservationTab, number>> {
  const results = useQueries({
    queries: RESERVATION_TABS.map((tab) => ({
      queryKey: [...RESERVATIONS_KEY, 'mine', 'count', tab.value],
      queryFn: () =>
        listMyReservations({
          page: 0,
          size: 1,
          ...(tab.statuses ? { statuses: tab.statuses } : {}),
        }),
    })),
  });
  return Object.fromEntries(
    RESERVATION_TABS.flatMap((tab, index) => {
      const total = results[index]?.data?.page.totalElements;
      return total === undefined ? [] : [[tab.value, total]];
    }),
  );
}

/** Detaliile unei rezervări, încărcate doar când există un id. */
export function useReservation(
  reservationId: number | null,
): UseQueryResult<Reservation, ApiError> {
  return useQuery<Reservation, ApiError>({
    queryKey: [...RESERVATIONS_KEY, 'detail', reservationId],
    queryFn: () => getReservation(reservationId ?? 0),
    enabled: reservationId !== null,
  });
}

/** Anulează o rezervare, apoi reîncarcă rezervările și calendarul resursei (intervalul e liber). */
export function useCancelReservation(): UseMutationResult<
  Reservation,
  ApiError,
  { reservationId: number; reason: string }
> {
  const queryClient = useQueryClient();
  return useMutation<Reservation, ApiError, { reservationId: number; reason: string }>({
    mutationFn: ({ reservationId, reason }) => cancelReservation(reservationId, reason),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: RESERVATIONS_KEY }),
        queryClient.invalidateQueries({ queryKey: ['resources', 'calendar'] }),
      ]),
  });
}
