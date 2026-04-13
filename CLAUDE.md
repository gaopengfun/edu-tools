# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm** (lockfile is `pnpm-lock.yaml`).

- `pnpm dev` — start Vite dev server (with proxies configured, required for the OSS check feature in dev).
- `pnpm build` — runs `type-check` and `build-only` in parallel via `npm-run-all2`.
- `pnpm type-check` — `vue-tsc --build` (project-references aware, type-only).
- `pnpm build-only` — `vite build` without type checking.
- `pnpm preview` — preview the production build.
- `pnpm lint` — runs **oxlint** then **eslint** (both with `--fix`). Lint stack is a two-pass setup; do not skip oxlint.
- `pnpm format` — `oxfmt src/`.

No test runner is configured in this repo.

## Architecture

SPA built with **Vue 3 + `<script setup>` + TypeScript + Vite 8**, using Pinia and vue-router (hash history, `createWebHashHistory`). Path alias `@` → `src/`. Build `base` is `./` (relative), so the output is deployable as a static bundle from any subpath.

The app is a collection of self-contained diagnostic/utility "views" mounted under `src/views/<tool-name>/`. Each view colocates its component, `types.ts`, and a `composables/` folder containing the tool's core logic as composition functions. The router lazy-loads each view. To add a new tool, create a new folder under `src/views/` following this layout and register a route in `src/router/index.ts`.

### OSS check feature (`src/views/oss-check/`)

Runs a 4-step sequential health check against Alibaba Cloud OSS from the browser: public-internet reachability → OSS endpoint reachability → token acquisition + PUT-endpoint probe → actual signed upload. Key implementation notes that are non-obvious and must be preserved:

- **Dev-only Vite proxy** `/api-dihw-smarthw` → token service (`zytestaliyun.ceshiservice.cn`) in `vite.config.ts`.
- OSS requests go **directly** to `https://${bucket}.${endPoint}/...`; the target bucket must have CORS configured to allow the app origin (and the `Authorization`, `x-oss-*` headers). The reachability probe uses `mode: 'no-cors'` so the absence of CORS does not falsely fail it.
- **OSS V4 signing** is implemented by hand with `crypto.subtle` in `useOssCheck.ts`. Two easy-to-break invariants:
  - `CanonicalURI` must include the bucket prefix (`/<bucket>/<object>`) even with virtual-hosted-style requests — this is an OSS↔AWS SigV4 divergence.
  - The final signature is `HEX(HMAC-SHA256(signingKey, stringToSign))` — do **not** also SHA-256 it.
- `docs/api-getOSSToken.md` documents the token endpoint response shape; `src/views/oss-check/types.ts` is the source of truth for the TS types.

## Conventions

- TypeScript is strict; Vue SFCs use `<script setup lang="ts">`. Vue-specific ESLint rules from `eslint-plugin-vue` apply.
- Formatter is **oxfmt** (not Prettier — `eslint-config-prettier` is only present to disable conflicting stylistic rules). Semicolons and trailing commas are expected (see recent commits).
- Commit messages follow Conventional Commits with **Chinese subject/body** (see user's global `CLAUDE.md`).

## UI / UX (Material Design 3)

Follow **Material Design 3** for new or changed UI: semantic color roles (primary / surface / on-surface, state layers), a clear type scale, consistent shape and spacing (8dp rhythm), MD3-style components and surfaces, short purposeful motion, and visible keyboard focus. Reuse existing app tokens and styles before adding new ones.
