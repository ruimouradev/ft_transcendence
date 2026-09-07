ENV_KEYS := POSTGRES_PASSWORD O42_CLIENT_ID O42_CLIENT_SECRET \
 MAIL_PASSWORD SECRET_KEY GRAFANA_ADMIN_PASSWORD

ENV_PROBLEM := $(shell \
 if [ ! -f .env ]; then \
  echo "No .env found, copy .env.example to .env and fill it in"; \
 else \
  left=$$(for k in $(ENV_KEYS); do \
   grep -Eq "^$$k=(change-me|request .*)$$" .env && echo $$k; \
  done); \
  [ -n "$$left" ] && echo "Set a real value in .env for:" $$left; \
 fi)


all: vinit
ifneq ($(ENV_PROBLEM),)
	@echo "$(ENV_PROBLEM)"
else
	docker compose -f ./docker-compose.yml build frontend_prod
	docker compose -f ./docker-compose.yml run --rm frontend_prod
	docker image rm frontend_prod:latest
	docker compose -f ./docker-compose.yml build nginx_prod backend
	docker compose -f ./docker-compose.yml up -d db redis backend nginx_prod postgres-exporter prometheus grafana
endif


build: vinit
	docker compose -f ./docker-compose.yml build frontend_prod --no-cache
	docker compose -f ./docker-compose.yml run --rm frontend_prod
	docker compose -f ./docker-compose.yml build --no-cache

re: down all

vinit:
	@mkdir -p ./nginx/dist


dev: vinit
ifneq ($(ENV_PROBLEM),)
	@echo "$(ENV_PROBLEM)"
else
	docker compose -f ./docker-compose.yml build frontend backend nginx
	docker compose -f ./docker-compose.yml up db redis backend frontend adminer nginx
endif


prod: vinit
ifneq ($(ENV_PROBLEM),)
	@echo "$(ENV_PROBLEM)"
else
	docker compose -f ./docker-compose.yml build frontend_prod
	docker compose -f ./docker-compose.yml run --rm frontend_prod
	docker image rm frontend_prod:latest
	docker compose -f ./docker-compose.yml build nginx_prod backend
	docker compose -f ./docker-compose.yml up db redis backend nginx_prod
endif


test_prod: clean vinit 
	docker compose -f ./docker-compose.yml build frontend_prod
	docker compose -f ./docker-compose.yml run --rm frontend_prod
	docker image rm frontend_prod:latest
	docker compose -f ./docker-compose.yml build nginx_prod backend
	docker compose -f ./docker-compose.yml up db redis backend nginx_prod

down:
	docker compose -f ./docker-compose.yml down
	@echo "[INFO] Docker containers stopped and removed."

data:
	docker compose -f ./docker-compose.yml exec backend python -m app.scripts.seed_friends
	@echo "[INFO] Demo accounts created on @ex.pt."

data_clean:
	docker compose -f ./docker-compose.yml exec backend python -m app.scripts.seed_friends --delete

clean:
	docker compose -f ./docker-compose.yml down --rmi local -v
	@echo "[INFO] Containers, images and data of this project removed."


fclean: clean
	docker run --rm -v $(CURDIR)/frontend:/app -v $(CURDIR)/nginx:/nginx \
	node:22-alpine rm -rf /app/dist /nginx/dist
	@echo "[INFO] Frontend build output removed as well."


ps:
	docker compose -f ./docker-compose.yml ps

log:
	docker compose -f ./docker-compose.yml logs

help:
	@echo "Available Makefile targets:"
	@echo "  all            - Build and start the whole stack in the background."
	@echo "  build          - Build Docker images without using cache."
	@echo "  re             - Stop everything and start it again."
	@echo "  dev            - Start part of the stack in the foreground, for development."
	@echo "  vinit          - Create the folder the nginx build writes into."
	@echo "  down           - Stop and remove the containers."
	@echo "  data           - Fill the running stack with demo accounts, friends and games."
	@echo "  data_clean     - Remove what data created."
	@echo "  clean          - Stop services and remove the containers, images and data of this project."
	@echo "  ps             - List the running containers."
	@echo "  log            - View the logs of every service."

.PHONY: all build vinit dev re down data data_clean clean ps log help