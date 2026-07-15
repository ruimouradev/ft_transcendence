
## Environment Setup

Copy the sample environment file and adjust the values for your machine:

```bash
cp .env.example .env
```

Important variables:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `DBDATAPATH` - host path used for the database volume
- `DATABASE_URL` - connection string used by the backend
- `SECRET_KEY` - JWT signing key
- `WATCHPACK_POLLING` - useful for frontend hot reload inside Docker

## Run Locally

Start the full stack:

```bash
make all
```

This will create the host data directory and launch the services in detached mode.

Useful targets:

```bash
make build
make down
make clean_compose
make clean_images
make clean_host_data
make ps
make log
```

## Services

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- nginx HTTP redirect: `http://localhost:8080`
- nginx HTTPS entrypoint: `https://localhost:8443`
- Adminer: `http://localhost:8081`
