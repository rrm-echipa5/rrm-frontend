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

## Structura

```text
src/
  main.tsx        # providerii: tema Mantine, TanStack Query, rutele
  routes.tsx      # rutele aplicației
  api/            # clientul HTTP și tipurile din rrm-api.yaml
  components/     # componente comune (cadrul paginilor)
  features/       # câte un folder pentru fiecare grup de pagini
  test/           # configurarea testelor
scripts/          # verificarea convențiilor Git (branch, commit, titlu PR)
```

## Contribuții

Fluxul de lucru, coding style-ul și verificările automate sunt descrise în [CONTRIBUTING.md](CONTRIBUTING.md).
