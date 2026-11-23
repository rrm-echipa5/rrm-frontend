// Echipele, membrii și proiectele din `rrm-backend/db/seed.sql` (KAN-56).

/** Un rând din tabelul `teams`. */
export interface SeedTeam {
  id: number;
  name: string;
  coordinatorId: number;
}

/** Tabelul `teams`. */
export const SEED_TEAMS: SeedTeam[] = [
  { id: 1, name: 'Laboratorul de Nanomateriale', coordinatorId: 2 },
  { id: 2, name: 'Grupul de Calcul Științific', coordinatorId: 6 },
];

/** Tabelul `team_members`: perechi `[teamId, userId]`. */
export const SEED_TEAM_MEMBERS: [teamId: number, userId: number][] = [
  [1, 2],
  [1, 3],
  [1, 5],
  [2, 6],
  [2, 5],
];

/** Un rând din tabelul `projects`. */
export interface SeedProject {
  id: number;
  teamId: number;
  title: string;
  budgetHours: number;
}

/** Tabelul `projects`. */
export const SEED_PROJECTS: SeedProject[] = [
  { id: 1, teamId: 1, title: 'Nanostructuri pentru senzori de gaz', budgetHours: 120 },
  { id: 2, teamId: 1, title: 'Filme subțiri de ZnO', budgetHours: 60 },
  { id: 3, teamId: 2, title: 'Simulări de dinamică moleculară', budgetHours: 200 },
];

/** Echipele din care face parte utilizatorul. */
export function teamsOf(userId: number): SeedTeam[] {
  const teamIds = new Set(
    SEED_TEAM_MEMBERS.filter(([, memberId]) => memberId === userId).map(([teamId]) => teamId),
  );
  return SEED_TEAMS.filter((team) => teamIds.has(team.id));
}
