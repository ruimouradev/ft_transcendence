*This project has been created as part of the 42 curriculum by acaldeir, bliu, vloureir and rusilva-.*

# ft_transcendence, Uno

## Description

A web version of Uno, built as the ft_transcendence project at 42
Lisboa. Registered players create or join rooms, play live against each
other and against an AI opponent, and every finished game lands in
their match history. The official rules are the default, +4 challenge
included, with optional house rules (hand size, +2 stacking,
seven-zero) chosen when the room is created. The server owns the real
game state and each client only ever sees what it is allowed to see.

Key features: real-time remote play over WebSockets, AI opponents,
user accounts with OAuth and 2FA, stats and match history, a public
API, and a full monitoring stack with live game dashboards.

## Instructions

Prerequisites: Docker with the compose plugin, make, and a free 8443
port.

1. Copy the sample environment file and adjust it for your machine:

   ```bash
   cp .env.example .env
   ```

   Important variables:

   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
   - `DBDATAPATH`: host path used for the database volume
   - `SECRET_KEY`: JWT signing key
   - `O42_CLIENT_ID`, `O42_CLIENT_SECRET`: requested from the 42 intra,
     needed for the 42 login
   - `MAIL_USERNAME`, `MAIL_PASSWORD`: the account that sends the
     verification and recovery emails
   - `FIRST_SUPERUSER`, `FIRST_SUPERUSER_PASSWORD`: admin account
     created on the first start
   - `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD`: Grafana login
   - `WATCHPACK_POLLING`: useful for frontend hot reload inside Docker

2. Start the whole stack with one command:

   ```bash
   make all
   ```

3. Open https://localhost:8443. The certificate is self-signed, so the
   browser asks you to trust it once.

Useful targets (`make help` lists them all): `make re` restarts
everything, `make dev` runs the site in the foreground with the logs
attached and without the monitoring stack, `make ps` and `make log`
inspect the containers, `make down` stops them, `make clean` also
removes images and persistent data.

Services:

- Frontend: `https://localhost:8443`
- Backend API docs: `https://localhost:8443/docs`
- Adminer: `http://localhost:8081` (local only, it is not published by
  nginx)
- Grafana: `http://localhost:3001` (local only, never exposed by nginx)

## Team Information

<!-- TODO(team): assign the formal roles (PO, PM, Tech Lead) -->

| Member | Area | Responsibilities |
| --- | --- | --- |
| Bin | Platform | Repo skeleton, one-command Docker, DB schema and ORM, auth, OAuth, 2FA, public API, stats and match history |
| Vinicius | Frontend | Lobby, game room, card rendering, WebSocket client, settings panel, themes, design system |
| Rui | Game core and monitoring | Rules engine (official rules, +4 challenge), game customization, engine-realtime contract, Prometheus and Grafana monitoring, testing across the project |
| Alexandre | Real-time and AI | WebSocket layer, per-client views, reconnection, remote players, AI opponent |

Shared by all four: Docker one-command startup, Privacy Policy and
Terms pages, tests, and the multi-user testing.

## Project Management

<!-- TODO(team): confirm and complete -->

## Technical Stack

- **Backend: FastAPI (Python).** Async-friendly, first-class WebSocket
  support and pydantic validation on every message, which is the
  backbone of the game protocol.
- **Frontend: React with Tailwind CSS.** <!-- TODO(Vinicius): confirm wording and reasons -->
- **Database: PostgreSQL with SQLModel/SQLAlchemy (ORM).** Relational
  data (users, games, participations) with real constraints, inspected
  via Adminer.
- **Real-time: WebSockets.** One socket per player per room. The
  server validates every action and broadcasts personalized snapshots.
- **Infrastructure: Docker Compose behind a single nginx entry point**
  (TLS termination and routing, the only exposed door).
- **Monitoring: Prometheus + Grafana** with a postgres exporter and
  provisioned dashboards and alerts.

## Database Schema

<!-- TODO(Bin): diagram or table-by-table description, subject requires a visual representation or description -->

The models live in `backend/app/models/`. In short: users (accounts,
avatars, friends), games and per-player participations (score, rank,
remaining points) that feed the stats and match history.

## Features List

<!-- TODO(team): review, this is the working list -->

| Feature | Who | What it does |
| --- | --- | --- |
| Uno rules engine | Rui | Every move validated in one place: official rules, +4 bluff and challenge, scoring |
| Game customization | Rui | Hand size, +2 stacking, seven-zero, room size, public/private rooms |
| Wire protocol | Rui | Typed message contract between server and browser, per-player snapshots, error codes |
| Monitoring | Rui | Prometheus metrics, two Grafana dashboards, alert rules |
| Realtime rooms | Alexandre | Rooms over WebSockets, seats, reconnection with grace periods, broadcasting |
| Remote players | Alexandre | Full game playable from different machines |
| AI opponent | Alexandre | Bots that take seats and play by the rules |
| User management | Bin | Signup/login, profiles, avatars, friends, online status |
| OAuth + 2FA | Bin | Third-party login and two-factor authentication |
| Public API | Bin | Documented endpoints with API key and rate limiting |
| Stats and match history | Bin | Every finished game recorded, per-user stats |
| Game UI | Vinicius | Lobby, table, cards, turn indicators, wild color pick |
| Design system | Vinicius | Reusable components and themes |

## Modules

24 points implemented, well above the 14 the subject requires.

| Module | Type | Points | Who |
| --- | --- | --- | --- |
| Web game (play against each other) | major | 2 | Rui, Alexandre, Vinicius |
| Multiplayer (3+ players) | major | 2 | shared (Uno is natively 2-4) |
| Remote players | major | 2 | Alexandre |
| AI opponent | major | 2 | Alexandre |
| Frameworks, frontend + backend | major | 2 | Bin, Vinicius |
| Real-time with WebSockets | major | 2 | Alexandre, Rui |
| Standard user management | major | 2 | Bin |
| Public API | major | 2 | Bin |
| Monitoring (Prometheus + Grafana) | major | 2 | Rui |
| ORM | minor | 1 | Bin |
| Game customization options | minor | 1 | Rui, Vinicius |
| Stats and match history | minor | 1 | Bin |
| Design system (10 components) | minor | 1 | Vinicius |
| OAuth (42 / Google) | minor | 1 | Bin |
| Two-factor authentication | minor | 1 | Bin |

**Total: 24 points** (9 majors, 6 minors).

<!-- TODO(team): one-line justification per module for the defense, and confirm the owners column -->

## Individual Contributions

<!-- TODO(each member): detailed breakdown, challenges and how they were overcome. Rui's draft below as the example -->

**Rui, game core and monitoring.** Wrote the rules engine
(`backend/app/game/engine.py`): every Uno rule in one pure, seedable,
fully tested module, including the +4 bluff/challenge and the house
rules. Defined the wire contract (`backend/app/game/contract.py`) that
the realtime layer and the frontend both build on, and the per-player
snapshot design that keeps hands secret. Built the monitoring stack:
Prometheus scraping the backend and a postgres exporter, two
provisioned Grafana dashboards and the alert rules. Also the team
tester: exercised each new feature live against the running stack and
hunted down bugs across all areas, from the frontend to the database
recording, reporting each one to its owner. Challenges: the +4
legality had to be frozen at play time so later draws could not change
the verdict, and the Uno call was redesigned as its own message racing
the catch, with a server-side grace window.

**Bin, platform.** <!-- TODO(Bin): review and complete, especially the challenges -->
Built the platform the game stands on: the repo skeleton, the Docker
Compose setup, the database models and ORM layer, authentication with
JWT cookies, user management (profiles, avatars, friends), the stats
and match history endpoints, and the mail service. Also the bot
accounts the AI seats play under, created automatically at startup.
OAuth (42 / Google) and two-factor authentication are his as well.
<!-- oauth and 2fa still to land, confirm before delivery -->

**Vinicius, frontend.** <!-- TODO(Vinicius): review and complete, especially the challenges -->
Built the browser client: home, login and register, the lobby and
join screens, the game room with card rendering and card back
selection, the WebSocket client, and the site theme with Tailwind.

**Alexandre, real-time and AI.** <!-- TODO(Alexandre): review and complete, especially the challenges -->
Built the realtime layer that runs the rooms: seats and tokens,
per-player broadcasting, reconnection with grace periods, one seat
per player across rooms, authentication on the socket, recording of
finished games to the database, and the game metrics feeding the
monitoring. The AI opponent that fills the bot seats is his as well,
with its difficulty levels.
<!-- ai difficulty levels still to land, confirm before delivery -->

## Resources

<!-- TODO(team): each member adds the references they used in their area -->

- Official Uno rules: <https://www.mattelgames.com/en-us/cards/uno>,
  what the engine implements, +4 challenge included.
- FastAPI: <https://fastapi.tiangolo.com/>, the backend framework,
  including its WebSocket support.
- Pydantic: <https://docs.pydantic.dev/>, validation of every message
  in the game protocol.
- SQLModel: <https://sqlmodel.tiangolo.com/>, the ORM over SQLAlchemy.
- PostgreSQL: <https://www.postgresql.org/docs/>.
- React: <https://react.dev/> and Tailwind CSS:
  <https://tailwindcss.com/docs>, the frontend stack.
- MDN WebSocket API: <https://developer.mozilla.org/en-US/docs/Web/API/WebSocket>,
  the client side of the realtime connection.
- Prometheus: <https://prometheus.io/docs/> and Grafana provisioning:
  <https://grafana.com/docs/grafana/latest/administration/provisioning/>,
  the monitoring stack as files in git.
- prometheus-fastapi-instrumentator and postgres-exporter, the two
  metric exporters.
- JWT: <https://datatracker.ietf.org/doc/html/rfc7519>, the signed
  login cookie that the backend and the game socket both verify.
- Docker Compose: <https://docs.docker.com/compose/> and nginx:
  <https://nginx.org/en/docs/>, the deployment.

### AI usage

AI was used to support specific aspects of the project, namely:

- Clarifying a few doubts about the project requirements and the
  scope of the chosen modules.
- Answering questions about concepts such as WebSocket communication,
  per-player game state, JWT sessions, OAuth and two-factor flows,
  ORM relations, React rendering, Tailwind utility classes, and
  monitoring with Prometheus and Grafana.
- Getting a second opinion on the initial architecture and the split
  between the game engine, the realtime layer and the frontend.
- Discussing and evaluating different approaches to dividing the work
  between team members.
- Assisting with debugging by explaining error messages and pointing
  to likely causes.
- Suggesting possible optimizations to some parts of the code.
- Structuring and drafting the README.

<!-- TODO(each member): add the tasks where you used AI in your area -->
