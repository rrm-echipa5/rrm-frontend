import type { CurrentUser } from '../api/types';
import { currentUser, userRef } from './mockDb';
import { teamsOf } from './seedTeams';

/** `GET /users/me`: utilizatorul din `VITE_MOCK_USER_ID`, cu echipele lui. */
export function currentUserProfile(): CurrentUser {
  const user = currentUser();
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? '',
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    teams: teamsOf(user.id).map((team) => ({
      id: team.id,
      name: team.name,
      coordinator: userRef(team.coordinatorId),
    })),
  };
}
