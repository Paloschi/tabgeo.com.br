<div align="center">
<a href="https://tabgeo.com.br"><img alt="Tab Geo" src="https://img.shields.io/badge/Tab%20Geo-geospatial%20content-14532D?style=for-the-badge&labelColor=052e16"></a>
<h1>Tab Geo</h1>
<p><strong>A place on the internet for people who work with geospatial technology and need content with real value.</strong></p>
<p>
<a href="https://tabgeo.com.br"><img alt="Production" src="https://img.shields.io/badge/site-tabgeo.com.br-14532D?style=flat-square"></a>
<a href="https://github.com/Paloschi/tabgeo.com.br/actions/workflows/tests.yaml"><img alt="Tests" src="https://github.com/Paloschi/tabgeo.com.br/actions/workflows/tests.yaml/badge.svg"></a>
<a href="https://github.com/Paloschi/tabgeo.com.br/actions/workflows/linting.yaml"><img alt="Linting" src="https://github.com/Paloschi/tabgeo.com.br/actions/workflows/linting.yaml/badge.svg"></a>
<img alt="Node" src="https://img.shields.io/badge/node-24-339933?style=flat-square&logo=nodedotjs&logoColor=white">
<a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-14532D?style=flat-square"></a>
</p>
<p>
<img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white">
<img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black">
<img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white">
<img alt="Jest" src="https://img.shields.io/badge/Jest-30-C21325?style=flat-square&logo=jest&logoColor=white">
<img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white">
</p>
<p>
<a href="https://curso.dev"><img alt="curso.dev" src="https://img.shields.io/badge/curso.dev-study%20project-1f6feb?style=flat-square"></a>
<a href="https://www.conventionalcommits.org/"><img alt="Conventional Commits" src="https://img.shields.io/badge/commits-conventional-FE5196?style=flat-square&logo=conventionalcommits&logoColor=white"></a>
<img alt="Deploy" src="https://img.shields.io/badge/deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white">
</p>
<p>
<a href="#quick-start">Quick start</a> ·
<a href="#scripts">Scripts</a> ·
<a href="#architecture">Architecture</a> ·
<a href="#http-api">API</a> ·
<a href="#testing">Testing</a> ·
<a href="#license">License</a>
</p>
</div>

---

Study project from [curso.dev](https://curso.dev). Production site:
[tabgeo.com.br](https://tabgeo.com.br).

Next.js **Pages Router** app with a versioned HTTP API (`/api/v1`), cookie
sessions, feature-based authorization, email activation, and PostgreSQL
migrations. Local services run in Docker; CI runs Prettier, ESLint,
Commitlint, and Jest on every pull request.

| Layer    | Stack                                                         |
| -------- | ------------------------------------------------------------- |
| Language | **Node.js 24**                                                |
| App      | **Next.js** 16 · **React** 19 · **SWR**                       |
| API      | **next-connect** routers + `infra/controller.js`              |
| Auth     | Cookie `session_id` (httpOnly, SameSite=Lax) · **bcryptjs**   |
| Access   | Feature flags on `users.features` (`models/authorization.js`) |
| Database | **PostgreSQL** 16 · **node-pg-migrate**                       |
| Email    | **Nodemailer** → Mailcatcher in development                   |
| Tests    | **Jest** 30 — integration against a live Next + Postgres      |
| Quality  | Prettier · ESLint · Husky · Commitlint · Commitizen           |

---

## Prerequisites

- **Node.js 24** (see `package.json` `engines` / `.nvmrc`)
- **Docker** + Docker Compose (Postgres and Mailcatcher)
- **npm**

---

## Quick start

```bash
git clone https://github.com/Paloschi/tabgeo.com.br.git
cd tabgeo.com.br
npm install
npm run dev
```

`npm run dev` starts Postgres + Mailcatcher, waits for the database, runs
pending migrations, then boots Next.js. Ctrl+C stops the app **and** the
containers.

| Service     | URL                          |
| ----------- | ---------------------------- |
| App         | http://localhost:3000        |
| Status page | http://localhost:3000/status |
| Mailcatcher | http://localhost:1080        |
| Postgres    | `localhost:5432`             |

Local credentials live in `.env.development` (committed for the study
project — not for production).

---

## Scripts

| Command                       | Purpose                                           |
| ----------------------------- | ------------------------------------------------- |
| `npm run dev`                 | Compose up → wait Postgres → migrate → `next dev` |
| `npm test`                    | Compose up → Next + Jest in band → compose stop   |
| `npm run test:watch`          | Jest watch (expects services already up)          |
| `npm run services:up`         | Start Postgres and Mailcatcher                    |
| `npm run services:stop`       | Stop containers (keep volumes)                    |
| `npm run services:down`       | Remove containers                                 |
| `npm run migrations:create`   | Create a new migration in `infra/migrations`      |
| `npm run migrations:up`       | Apply pending migrations                          |
| `npm run lint:prettier:check` | Prettier check                                    |
| `npm run lint:eslint:check`   | ESLint (`--max-warnings 0`)                       |
| `npm run commit`              | Commitizen (conventional commits)                 |

---

## Project structure

```text
tabgeo.com.br/
├── .github/workflows/       # PR CI: lint + tests
├── infra/
│   ├── compose.yaml         # Postgres 16 + Mailcatcher
│   ├── controller.js        # session cookie, auth injection, errors
│   ├── database.js          # pg pool
│   ├── email.js             # Nodemailer
│   ├── errors.js            # typed HTTP errors
│   ├── webserver.js         # origin (local / Vercel / production)
│   ├── migrations/          # node-pg-migrate
│   └── scripts/             # wait-for-*, next-with-cleanup
├── models/                  # domain: user, session, activation, authz
├── pages/
│   ├── index.js             # home
│   ├── status/              # live DB status (SWR)
│   └── api/v1/              # HTTP API
├── tests/
│   ├── orchestrator.js      # wait, seed, clean DB, fake email
│   ├── integration/         # API + email + registration flow
│   └── unit/                # authorization
└── jest.config.js
```

### Where to look first

| Concern               | Location                                  |
| --------------------- | ----------------------------------------- |
| Request plumbing      | `infra/controller.js`                     |
| Typed errors          | `infra/errors.js`                         |
| Users / passwords     | `models/user.js`, `models/password.js`    |
| Sessions              | `models/session.js`                       |
| Email activation      | `models/activation.js`, `infra/email.js`  |
| Feature authorization | `models/authorization.js`                 |
| Migrations            | `models/migrator.js`, `infra/migrations/` |
| Test helpers          | `tests/orchestrator.js`                   |

---

## Architecture

```text
browser  →  pages/  (React)
                 ↓
         pages/api/v1/*  (next-connect)
                 ↓
         controller.js   injectAnonymousOrUser + canRequest
                 ↓
         models/*        user / session / activation / authorization
                 ↓
         infra/          PostgreSQL · Nodemailer · typed errors
```

- Routes export `createRouter()` chained with `.use()`, HTTP verbs, and
  `controller.errorHandlers`.
- Unauthenticated requests get an anonymous user; a valid `session_id`
  cookie loads the real user into `request.context.user`.
- `authorization.can()` gates features (`create:user`, `create:session`,
  `read:status`, …). `filterOutput()` strips fields the caller must not see.
- New users start with `read:activation_token` only; activation email is
  sent through Mailcatcher locally.

---

## HTTP API

| Method            | Path                             | Role                             |
| ----------------- | -------------------------------- | -------------------------------- |
| `POST`            | `/api/v1/users`                  | Register + send activation email |
| `GET` / `PATCH`   | `/api/v1/users/[username]`       | Read / update a user             |
| `GET`             | `/api/v1/user`                   | Current session user             |
| `POST` / `DELETE` | `/api/v1/sessions`               | Login / logout                   |
| `PATCH`           | `/api/v1/activations/[token_id]` | Activate account                 |
| `GET` / `POST`    | `/api/v1/migrations`             | List / run migrations            |
| `GET`             | `/api/v1/status`                 | App + Postgres health            |

Wrong methods return `405` from `controller.onNoMatchHandler`. Domain
failures (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, …) map
to structured JSON.

---

## Testing

[![Tests](https://github.com/Paloschi/tabgeo.com.br/actions/workflows/tests.yaml/badge.svg)](https://github.com/Paloschi/tabgeo.com.br/actions/workflows/tests.yaml)

```bash
npm test
```

Jest talks to a real Next.js server, Postgres, and Mailcatcher.
`tests/orchestrator.js` waits for services, resets the schema, runs
migrations, and seeds users / sessions / activation tokens.

| Area                                      | What it covers             |
| ----------------------------------------- | -------------------------- |
| `tests/integration/api/v1/users/`         | Create, read, patch        |
| `tests/integration/api/v1/sessions/`      | Login and logout           |
| `tests/integration/api/v1/user/`          | Authenticated current user |
| `tests/integration/api/v1/activation/`    | Email token activation     |
| `tests/integration/api/v1/migrations/`    | Dry-run vs apply           |
| `tests/integration/api/v1/status/`        | Health payload             |
| `tests/integration/_use-cases/`           | Full registration flow     |
| `tests/integration/infra/email.test.js`   | Mailcatcher delivery       |
| `tests/unit/models/authorization.test.js` | Feature matrix             |

CI (GitHub Actions) runs on every **pull request**: Ubuntu × Node 24 —
linting (Prettier, ESLint, Commitlint) and `npm test`.

---

## Contributing

1. Use **conventional commits** (`feat:`, `fix:`, `chore:`, `docs:`).
   `npm run commit` opens Commitizen; Husky + Commitlint enforce the format.
2. Put tests in the same change as the behaviour they cover.
3. Open a pull request against `main` — CI must pass before merge.

---

## License

**MIT.** See [LICENSE](LICENSE).
