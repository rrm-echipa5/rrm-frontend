// Verifică convențiile Git ale echipei: numele branch-ului, mesajul de commit și titlul PR-ului.
// Folosit de hook-urile Husky (local) și de workflow-ul GitHub Actions (la fiecare pull request).
//
// Utilizare:
//   node scripts/check-git-conventions.mjs branch [nume-branch]
//   node scripts/check-git-conventions.mjs commit-msg .git/COMMIT_EDITMSG
//   node scripts/check-git-conventions.mjs pr-title "KAN-126: Lista resurselor" KAN-126-...
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const BRANCH_PATTERN = /^(KAN-\d+)-[a-z0-9]+(-[a-z0-9]+)+$/;
const MESSAGE_PATTERN = /^(KAN-\d+): \S.{8,}$/;
const MESSAGE_MAX_LENGTH = 72;
const ALLOWED_MESSAGE_PREFIXES = ['Merge ', 'Revert ', 'fixup! ', 'squash! ', 'amend! '];
const PROTECTED_BRANCHES = ['main', 'master'];

const BRANCH_HELP =
  'Numele branch-ului trebuie să conțină numărul tichetului Jira și titlul lui, cu litere mici ' +
  'și cratime, fără diacritice: KAN-<număr>-<titlul-tichetului>, de exemplu ' +
  'KAN-126-frontend-lista-resurselor-si-formularul.';
const MESSAGE_HELP =
  'Mesajul de commit (prima linie) are forma «KAN-<număr>: Descriere la imperativ», ' +
  `de cel mult ${String(MESSAGE_MAX_LENGTH)} de caractere, de exemplu ` +
  '«KAN-126: Adaugă formularul fișei resursei».';

/** Întoarce erorile pentru numele unui branch (lista goală dacă numele e corect). */
export function checkBranch(branch) {
  if (PROTECTED_BRANCHES.includes(branch)) {
    return [`Nu se lucrează direct pe ${branch}; creează un branch pentru tichet. ${BRANCH_HELP}`];
  }
  if (!BRANCH_PATTERN.test(branch)) {
    return [`Branch-ul «${branch}» nu respectă convenția. ${BRANCH_HELP}`];
  }
  return [];
}

/** Întoarce erorile pentru prima linie a unui mesaj de commit sau titlul unui PR. */
export function checkMessage(firstLine) {
  if (ALLOWED_MESSAGE_PREFIXES.some((prefix) => firstLine.startsWith(prefix))) {
    return [];
  }
  const errors = [];
  if (!MESSAGE_PATTERN.test(firstLine)) {
    errors.push(`Mesajul «${firstLine}» nu respectă convenția. ${MESSAGE_HELP}`);
  }
  if (firstLine.length > MESSAGE_MAX_LENGTH) {
    errors.push(
      `Prima linie are ${String(firstLine.length)} caractere; maximul este ${String(MESSAGE_MAX_LENGTH)}.`,
    );
  }
  return errors;
}

/** Verifică titlul PR-ului și faptul că se referă la același tichet ca branch-ul. */
export function checkPrTitle(title, branch) {
  const errors = [...checkBranch(branch), ...checkMessage(title)];
  const branchTicket = BRANCH_PATTERN.exec(branch)?.[1];
  const titleTicket = MESSAGE_PATTERN.exec(title)?.[1];
  if (branchTicket && titleTicket && branchTicket !== titleTicket) {
    errors.push(`Titlul PR-ului se referă la ${titleTicket}, dar branch-ul la ${branchTicket}.`);
  }
  return errors;
}

function firstCommitLine(path) {
  const lines = readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => !line.startsWith('#'));
  return (lines[0] ?? '').trim();
}

function currentBranch() {
  return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();
}

function main([command, ...args]) {
  let errors;
  if (command === 'branch') {
    errors = checkBranch(args[0] ?? currentBranch());
  } else if (command === 'commit-msg') {
    errors = checkMessage(firstCommitLine(args[0]));
  } else if (command === 'pr-title') {
    errors = checkPrTitle(args[0] ?? '', args[1] ?? '');
  } else {
    console.error(`Comandă necunoscută: ${String(command)}`);
    return 2;
  }
  errors.forEach((error) => {
    console.error(`✗ ${error}`);
  });
  return errors.length > 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exit(main(process.argv.slice(2)));
}
