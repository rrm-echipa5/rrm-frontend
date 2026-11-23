// Ce acțiuni arată interfața pentru fiecare rol, după secțiunile „Roluri” din rrm-api.yaml.
// Serverul verifică oricum fiecare cerere; aici doar nu arătăm butoane care ar primi 403.

import type { Role } from '../../api/types';

/** Acțiunile din pagina „Resurse” permise rolului curent. */
export interface ResourcePermissions {
  /** `POST /resources`: `RESOURCE_ADMIN`, `SYSTEM_ADMIN`. */
  canCreate: boolean;
  /** `PUT /resources/{id}`: administratorul resursei (serverul verifică resursa), `SYSTEM_ADMIN`. */
  canEdit: boolean;
  /** `DELETE /resources/{id}`: doar `SYSTEM_ADMIN`. */
  canDelete: boolean;
}

/**
 * Acțiunile permise pentru rolul dat. Cu rolul necunoscut (`null`, de exemplu cât timp backend-ul
 * nu are încă `GET /users/me`), butoanele rămân, iar serverul răspunde cu 403 unde nu e voie.
 */
export function resourcePermissions(role: Role | null): ResourcePermissions {
  if (role === null) {
    return { canCreate: true, canEdit: true, canDelete: true };
  }
  const admin = role === 'RESOURCE_ADMIN' || role === 'SYSTEM_ADMIN';
  return { canCreate: admin, canEdit: admin, canDelete: role === 'SYSTEM_ADMIN' };
}
