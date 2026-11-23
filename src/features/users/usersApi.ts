import { apiRequest } from '../../api/client';
import type { CurrentUser } from '../../api/types';

/** `GET /api/users/me`: profilul utilizatorului curent, cu rolul și echipele. */
export function getCurrentUser(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/users/me');
}
