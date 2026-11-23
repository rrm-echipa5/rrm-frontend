import { apiRequest } from '../../api/client';
import type {
  CancelReservationRequest,
  Reservation,
  ReservationStatus,
  ReservationSummaryPage,
  ResourceCalendar,
} from '../../api/types';

/** `GET /api/resources/{resourceId}/calendar`: intervalele ocupate dintre `start` și `end`. */
export function getResourceCalendar(
  resourceId: number,
  start: string,
  end: string,
): Promise<ResourceCalendar> {
  const query = new URLSearchParams({ start, end });
  return apiRequest<ResourceCalendar>(
    `/resources/${String(resourceId)}/calendar?${query.toString()}`,
  );
}

/** Parametrii listei „Rezervările mele” (`GET /api/users/me/reservations`). */
export interface MyReservationsParams {
  page: number;
  size: number;
  /** Doar rezervările cu aceste statusuri (`status`, repetat); toate dacă lipsește. */
  statuses?: readonly ReservationStatus[];
}

/** `GET /api/users/me/reservations`, în ordinea implicită `start,desc`. */
export function listMyReservations(params: MyReservationsParams): Promise<ReservationSummaryPage> {
  const query = new URLSearchParams({ page: String(params.page), size: String(params.size) });
  for (const status of params.statuses ?? []) {
    query.append('status', status);
  }
  return apiRequest<ReservationSummaryPage>(`/users/me/reservations?${query.toString()}`);
}

/** `GET /api/reservations/{reservationId}` */
export function getReservation(reservationId: number): Promise<Reservation> {
  return apiRequest<Reservation>(`/reservations/${String(reservationId)}`);
}

/** `POST /api/reservations/{reservationId}/cancel`, cu motivul opțional. */
export function cancelReservation(reservationId: number, reason: string): Promise<Reservation> {
  const body: CancelReservationRequest = reason.trim() === '' ? {} : { reason: reason.trim() };
  return apiRequest<Reservation>(`/reservations/${String(reservationId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
