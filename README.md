# rrm-frontend

Aplicația web a **Research Resource Manager** (echipa 5, Ingineria Programelor, USV): un SPA în TypeScript cu React, construit cu Vite, cu interfața în Mantine. Comunică doar cu API-ul REST din [rrm-backend](https://github.com/rrm-echipa5/rrm-backend), prin contractul `rrm-api.yaml` din Confluence.

## Cerințe

- Node.js 26 LTS (minimum 22; versiunea e și în `.nvmrc`) și npm, verificate cu `node -v` și `npm -v`
- Git
- Pentru datele reale: backend-ul [rrm-backend](https://github.com/rrm-echipa5/rrm-backend) pornit local pe portul 8080, cu baza de date (pașii sunt în README-ul lui). Fără backend, aplicația merge cu datele de test (vezi mai jos).

## Instalare

```bash
git clone https://github.com/rrm-echipa5/rrm-frontend.git
cd rrm-frontend
npm ci
```

`npm ci` instalează exact versiunile din `package-lock.json` și activează hook-urile Husky (verificările de la commit și push). Se folosește `npm install` doar când adaugi sau actualizezi o dependență.

Verificarea instalării, aceleași comenzi ca în GitHub Actions:

```bash
npm run check   # ESLint, Prettier, TypeScript și testele Vitest
npm run build   # build-ul de producție în dist/
```

## Pornire

### Cu backend-ul local

```bash
npm run dev
```

Aplicația se deschide pe `http://localhost:5173`. Vite trimite cererile `/api` la backend-ul local (`http://localhost:8080`); altă adresă se poate da cu variabila `RRM_API_TARGET` (de exemplu `RRM_API_TARGET=http://localhost:8081 npm run dev`). Utilizatorul în numele căruia se fac cererile se alege în backend, cu `RRM_DEMO_USER_ID` din `.env`-ul lui (până la autentificare, KAN-64).

Pagina de start arată dacă backend-ul și baza de date răspund.

### Fără backend: datele de test (mock)

```bash
npm run dev:mock
```

Cererile `/api` primesc răspunsuri din `src/mocks` (MSW), cu datele din `rrm-backend/db/seed.sql`, formatul din `rrm-api.yaml` și drepturile din backend. Cererile fără răspuns mock ajung în continuare la backend. Modificările (resurse adăugate, rezervări anulate) se păstrează doar până la reîncărcarea paginii.

Setările modului mock sunt în `.env.mock`. Pentru valori doar pe mașina ta, creezi `.env.mock.local` (nu intră în Git) și scrii acolo doar ce schimbi:

```bash
# .env.mock.local
VITE_MOCK_USER_ID=3
VITE_MOCK_NOW=2026-11-20T10:00:00+02:00
```

| Variabilă           | Ce face                                                                                                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_MOCK_USER_ID` | Utilizatorul curent, ca `RRM_DEMO_USER_ID` din backend: 4 = Mihai Ionescu (administrator de resurse, implicit), 3 = Ana Popescu (studentă), 2 = Andrei Rusu (coordonator), 1 = Elena Marin (administratoare de sistem) |
| `VITE_MOCK_NOW`     | Momentul „acum” al datelor mock; cu 20-21 noiembrie 2026, Microscopul SEM apare în calibrare                                                                                                                           |

După ce schimbi un fișier `.env`, repornești `npm run dev:mock`.

## Pagini

| Pagină          | Ce face                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | Pagina de start, cu starea backend-ului și a bazei de date (`GET /api/health`)                                                                                                                                                                                                                                                                                                                                                     |
| `/catalog`      | Catalogul resurselor ca în prototip: carduri cu starea colorată și certificarea cerută, filtre combinate pe text, categorie, stare și tag-uri (`GET /api/resources`)                                                                                                                                                                                                                                                               |
| `/catalog/{id}` | Fișa resursei: specificații, reguli de utilizare, fluxul de aprobare, certificarea utilizatorului, manuale, mentenanța programată (`GET /api/resources/{id}`, `GET /api/users/me/certifications`), plus calendarul săptămânal cu intervalele ocupate, în așteptare, în mentenanță și rezervările proprii, cu alegerea unui interval liber prin click sau prin tragere, după regulile resursei (`GET /api/resources/{id}/calendar`) |
| `/resources`    | Administrarea resurselor: căutare, filtru pe categorie, paginare, adăugare, modificare și ștergere (`/api/resources`)                                                                                                                                                                                                                                                                                                              |

Cu `npm run dev`, datele vin din backend-ul local; cu `npm run dev:mock`, din stratul mock. Testele automate (Vitest) simulează API-ul fie cu `fetch` simulat, fie cu aceleași handlere MSW ca stratul mock.

## Probleme cunoscute

| Problema                                                                                                                                                                       | Cauza și rezolvarea                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pagina de start arată „Serverul nu răspunde”, paginile arată „Serverul a răspuns cu 502 Bad Gateway”, iar în terminal apare `http proxy error ... ECONNREFUSED 127.0.0.1:8080` | Backend-ul nu e pornit (sau nu pe portul 8080). Se pornește backend-ul după README-ul lui, se dă altă adresă cu `RRM_API_TARGET` sau se lucrează cu `npm run dev:mock`.                                                  |
| Aplicația pornește pe `http://localhost:5174` în loc de 5173                                                                                                                   | Portul 5173 e ocupat, de obicei de alt `npm run dev` rămas deschis; Vite alege singur portul următor și îl afișează în terminal. Se oprește celălalt server (Ctrl+C în terminalul lui) sau se folosește adresa afișată.  |
| Pagina de start arată „Baza de date indisponibilă”                                                                                                                             | Backend-ul merge, dar baza PostgreSQL nu e pornită: `docker compose up -d` în `rrm-backend`.                                                                                                                             |
| `npm ci` se oprește cu `EPERM` pe `node_modules` (Windows)                                                                                                                     | Un server Vite rulează încă din alt terminal și ține fișierele deschise. Se oprește `npm run dev` înainte de `npm ci`.                                                                                                   |
| Prettier sau commit-ul raportează toate fișierele ca neformatate (Windows)                                                                                                     | Fișierele au fost scoase cu sfârșit de linie CRLF. `.gitattributes` cere LF; pe un clone vechi: `git config core.autocrlf false`, apoi `git rm -r --cached . && git reset --hard` (fără modificări nesalvate).           |
| Commit-ul e refuzat de hook-ul `commit-msg` sau push-ul de `pre-push`                                                                                                          | Mesajul trebuie să înceapă cu `KAN-<număr>: `, cu prima linie de cel mult 72 de caractere, iar branch-ul să fie `KAN-<număr>-<titlu>`; la push rulează și testele. Detaliile sunt în [CONTRIBUTING.md](CONTRIBUTING.md). |

## Structura

```text
src/
  main.tsx        # providerii: tema Mantine, TanStack Query, rutele
  routes.tsx      # rutele aplicației
  api/            # clientul HTTP și tipurile din rrm-api.yaml
  components/     # componente comune (cadrul paginilor)
  features/       # câte un folder pentru fiecare grup de pagini
    home/         # pagina de start
    resources/    # catalogul, fișa resursei și administrarea resurselor
    reservations/ # calendarul resursei
  mocks/          # stratul mock (MSW): handlerele și datele de test din seed.sql
  test/           # configurarea testelor
scripts/          # verificarea convențiilor Git (branch, commit, titlu PR)
```

## Contribuții

Fluxul de lucru, coding style-ul și verificările automate sunt descrise în [CONTRIBUTING.md](CONTRIBUTING.md).
