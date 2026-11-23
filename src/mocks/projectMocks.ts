import type { ProjectBudget, ReservationStatus } from '../api/types';
import { allReservations, userRef } from './mockDb';
import { SEED_PROJECTS, SEED_TEAMS, type SeedProject, teamsOf } from './seedTeams';

/** Statusurile ale căror ore se scad din buget (vederea `project_budgets`). */
const CONSUMING: ReservationStatus[] = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];

function hoursBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000;
}

/** Bugetul unui proiect, cu orele consumate de rezervările confirmate, în curs sau finalizate. */
export function projectBudget(project: SeedProject): ProjectBudget {
  const team = SEED_TEAMS.find((candidate) => candidate.id === project.teamId);
  if (team === undefined) {
    throw new Error(`Echipa ${String(project.teamId)} lipsește din datele de test.`);
  }
  const usedHours = allReservations()
    .filter((item) => item.projectId === project.id && CONSUMING.includes(item.status))
    .reduce((sum, item) => sum + hoursBetween(item.start, item.end), 0);
  return {
    id: project.id,
    title: project.title,
    team: { id: team.id, name: team.name, coordinator: userRef(team.coordinatorId) },
    budgetHours: project.budgetHours,
    usedHours,
    remainingHours: project.budgetHours - usedHours,
  };
}

/** `GET /users/me/projects`: proiectele echipelor utilizatorului. */
export function myProjects(userId: number): ProjectBudget[] {
  const teamIds = new Set(teamsOf(userId).map((team) => team.id));
  return SEED_PROJECTS.filter((project) => teamIds.has(project.teamId)).map(projectBudget);
}
