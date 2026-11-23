import {
  useMutation,
  type UseMutationResult,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { ApiError } from '../../api/client';
import type { ProjectBudget, Reservation, ReservationCreateRequest } from '../../api/types';
import { createReservation, listMyProjects } from './reservationsApi';

/** Proiectele utilizatorului, pentru alegerea proiectului din al cărui buget se scad orele. */
export function useMyProjects(): UseQueryResult<ProjectBudget[], ApiError> {
  return useQuery<ProjectBudget[], ApiError>({
    queryKey: ['projects', 'me'],
    queryFn: listMyProjects,
  });
}

/** Trimite cererea, apoi reîncarcă rezervările, calendarul și bugetele (intervalul e ocupat). */
export function useCreateReservation(): UseMutationResult<
  Reservation,
  ApiError,
  ReservationCreateRequest
> {
  const queryClient = useQueryClient();
  return useMutation<Reservation, ApiError, ReservationCreateRequest>({
    mutationFn: createReservation,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reservations'] }),
        queryClient.invalidateQueries({ queryKey: ['resources', 'calendar'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
      ]),
  });
}
