# Electric Designer Tool

App web para diseño de automatización industrial con editor visual, catálogo, presupuestos y reportes PDF.

## Requisitos
- Node.js 18+
- pnpm 10+
- Postgres (para la API)

## Scripts principales
- Frontend: `pnpm dev:web`
- Backend: `pnpm dev:api`

## Estructura
- `apps/web`: React + Vite + CSS vanilla
- `apps/api`: Node + Express + Postgres + JWT
- `packages/shared`: utilidades y esquemas compartidos

## Variables de entorno (API)
Crea un archivo `.env` en `apps/api` basado en `.env.example`.

## Nota
El logo en PDF es placeholder y debe sustituirse por el logo real de la empresa.
