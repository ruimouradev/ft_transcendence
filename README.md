
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

- Frontend: `https://localhost:8443`
- Backend: `https://localhost:8443/docs`
- Adminer: `https://localhost:8443/adminer`
