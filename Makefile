all: envcheck vinit
	docker compose -f ./docker-compose.yml build frontend_prod
	docker compose -f ./docker-compose.yml run --rm frontend_prod
	docker image rm frontend_prod:latest
	docker compose -f ./docker-compose.yml build nginx_prod backend
	docker compose -f ./docker-compose.yml up -d db redis backend nginx_prod postgres-exporter prometheus grafana


build: vinit
	docker compose -f ./docker-compose.yml build frontend_prod --no-cache
	docker compose -f ./docker-compose.yml run --rm frontend_prod
	docker compose -f ./docker-compose.yml build --no-cache

re: down all

vinit:
	@mkdir -p ./nginx/dist

envcheck:
	@test -f .env || { echo "No .env found, copy .env.example to .env and fill it in"; exit 1; }
	@left=$$(grep -E '^(POSTGRES_PASSWORD|O42_CLIENT_ID|O42_CLIENT_SECRET|MAIL_PASSWORD|SECRET_KEY|GRAFANA_ADMIN_PASSWORD|)=' .env | grep -E '=(change-me|request .*)$$' | cut -d= -f1); \
	if [ -n "$$left" ]; then echo "Set a real value in .env for:\n$$left"; exit 1 ; fi

dev: envcheck vinit
	docker compose -f ./docker-compose.yml build frontend backend nginx
	docker compose -f ./docker-compose.yml up db redis backend frontend adminer nginx

prod: envcheck vinit
	docker compose -f ./docker-compose.yml build frontend_prod
	docker compose -f ./docker-compose.yml run --rm frontend_prod
	docker image rm frontend_prod:latest
	docker compose -f ./docker-compose.yml build nginx_prod backend
	docker compose -f ./docker-compose.yml up db redis backend nginx_prod

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

.PHONY: all build vinit envcheck dev re down data data_clean clean ps log help
