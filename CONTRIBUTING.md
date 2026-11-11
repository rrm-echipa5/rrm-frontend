# Cum lucrăm în rrm-frontend

Regulile complete sunt în Confluence, în paginile **Coding style frontend** și **GitHub** (pagini copil ale Documentului de Arhitectură). Aici e varianta scurtă, pentru lucrul de zi cu zi.

## Fluxul pentru un tichet

1. Iei tichetul din Jira după ce te-ai înțeles cu echipa și îl treci în **In Progress**.
2. Pornești din `main` actualizat și creezi un branch cu numărul și titlul tichetului:

   ```bash
   git switch main && git pull
   git switch -c KAN-126-frontend-lista-resurselor-si-formularul-de-adaugare-modificare-si-stergere
   ```

3. Faci commit-uri mici, cu mesaje de forma `KAN-126: Adaugă formularul fișei resursei`.
4. Deschizi un pull request spre `main`, cu titlul `KAN-126: ...`, și ceri review de la cel puțin un coleg.
5. După approval și după ce trec verificările din GitHub Actions, integrezi cu **Squash and merge** sau **Rebase and merge**. Branch-ul se șterge automat.
6. Actualizezi `main` local, verifici aplicația în browser și treci tichetul în **Done**.

Un branch conține doar codul tichetului lui. Dacă descoperi că mai e nevoie de altceva, creezi un tichet nou.

## Ce este verificat automat

| Regulă                             | Local (Husky)                      | La PR (GitHub Actions)             |
| ---------------------------------- | ---------------------------------- | ---------------------------------- |
| Reguli de cod și denumiri (ESLint) | la commit, pe fișierele modificate | job-ul _Coding style_              |
| Formatare (Prettier)               | la commit, pe fișierele modificate | job-ul _Coding style_              |
| Tipuri (`tsc` strict)              | la commit                          | job-ul _Coding style_              |
| Teste (Vitest) și build            | la push                            | job-ul _Teste și build_            |
| Mesaj de commit `KAN-<număr>: ...` | la commit                          | titlul PR-ului, job-ul _Convenții_ |
| Branch `KAN-<număr>-<titlu>`       | la push                            | job-ul _Convenții_                 |

Branch-ul `main` acceptă modificări doar prin pull request, cu cel puțin un approval de la alt membru al echipei și cu toate verificările de mai sus trecute.

## Comenzi utile

```bash
npm install          # instalează dependențele și activează hook-urile Husky
npm run dev          # aplicația pe http://localhost:5173
npm run lint:fix     # repară ce se poate automat în regulile ESLint
npm run format       # formatează codul cu Prettier
npm run check        # lint, formatare, tipuri și teste, ca în GitHub Actions
```
