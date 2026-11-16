# rrm-frontend

Aplicația web a **Research Resource Manager** (echipa 5, Ingineria Programelor, USV): un SPA în TypeScript cu React, construit cu Vite, cu interfața în Mantine. Comunică doar cu API-ul REST din [rrm-backend](https://github.com/rrm-echipa5/rrm-backend), prin contractul `rrm-api.yaml` din Confluence.

## Cerințe

- Node.js 26 LTS (minimum 22)
- Backend-ul [rrm-backend](https://github.com/rrm-echipa5/rrm-backend) pornit local pe portul 8080, cu baza de date

## Pornire

```bash
npm install
npm run dev
```

Aplicația se deschide pe `http://localhost:5173`. Vite trimite cererile `/api` la backend-ul local (`http://localhost:8080`); altă adresă se poate da cu variabila `RRM_API_TARGET`.

### Fără backend: datele de test (mock)

```bash
npm run dev:mock
```

Cererile `/api` pentru catalog și fișa resursei primesc răspunsuri din `src/mocks` (MSW), cu datele din `rrm-backend/db/seed.sql` și formatul din `rrm-api.yaml`. Utilizatorul curent este Ana Popescu (student). Cererile fără răspuns mock (de exemplu adăugarea unei resurse) ajung în continuare la backend. Ca Microscopul SEM să apară în mentenanță (calibrarea din 20-21 noiembrie 2026), se decomentează `VITE_MOCK_NOW` în `.env.mock`.

## Pagini

| Pagină          | Ce face                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | Pagina de start, cu starea backend-ului și a bazei de date (`GET /api/health`)                                                                                                                    |
| `/catalog`      | Catalogul resurselor ca în prototip: carduri cu starea colorată și certificarea cerută, filtre combinate pe text, categorie, stare și tag-uri (`GET /api/resources`)                              |
| `/catalog/{id}` | Fișa resursei: specificații, reguli de utilizare, fluxul de aprobare, certificarea utilizatorului, manuale, mentenanța programată (`GET /api/resources/{id}`, `GET /api/users/me/certifications`) |
| `/resources`    | Administrarea resurselor: căutare, filtru pe categorie, paginare, adăugare, modificare și ștergere (`/api/resources`)                                                                             |

Cu `npm run dev`, datele vin din backend-ul local; cu `npm run dev:mock`, din stratul mock. Testele automate (Vitest) simulează API-ul fie cu `fetch` simulat, fie cu aceleași handlere MSW ca stratul mock.

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
  mocks/          # stratul mock (MSW): handlerele și datele de test din seed.sql
  test/           # configurarea testelor
scripts/          # verificarea convențiilor Git (branch, commit, titlu PR)
```

## Contribuții

Fluxul de lucru, coding style-ul și verificările automate sunt descrise în [CONTRIBUTING.md](CONTRIBUTING.md).
