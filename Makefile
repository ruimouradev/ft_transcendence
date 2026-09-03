include ./.env

all: vinit
	docker compose -f ./docker-compose.yml build frontend_prod
	docker compose -f ./docker-compose.yml run --rm frontend_prod
	docker compose -f ./docker-compose.yml build nginx_prod backend
	docker compose -f ./docker-compose.yml up -d db redis backend nginx_prod postgres-exporter prometheus grafana


build:
	docker compose -f ./docker-compose.yml build --no-cache

re: down all

vinit:
	@mkdir -p ${DBDATAPATH}

dev: vinit
	docker compose -f ./docker-compose.yml build frontend backend nginx
	docker compose -f ./docker-compose.yml up db redis backend frontend adminer nginx

prod: vinit
	docker compose -f ./docker-compose.yml build frontend_prod
	docker compose -f ./docker-compose.yml run --rm frontend_prod
	docker image rm frontend_prod:latest
	docker compose -f ./docker-compose.yml build nginx_prod backend
	docker compose -f ./docker-compose.yml up db redis backend nginx_prod

down:
	docker compose -f ./docker-compose.yml down
	@echo "[INFO] Docker containers stopped and removed."

clean_compose:
	docker compose -f ./docker-compose.yml down --rmi all -v

clean_images:
	docker image rm $$(docker image ls -q) || true
	@echo "[INFO] Docker images cleaned."

clean_host_data: clean_compose
	@echo "[WARNING] This will delete all persistent data on the host! Are you sure? (y/N)"
	@read ans; \
	if [ "$$ans" != "y" ] && [ "$$ans" != "Y" ]; then \
		echo "Aborted."; \
		exit 1; \
	fi
	@echo "[CONFIRM] Deleting persistent data..."

	@if [ -n "$$(docker volume ls -q)" ]; then \
		docker volume rm $$(docker volume ls -q); \
	fi
	@if [ -z "${DBDATAPATH}" ]; then \
		echo "[ERROR] DBDATAPATH is empty, refusing to delete."; \
		exit 1; \
	fi
	sudo rm -rf ${DBDATAPATH}
	@echo "[INFO] All persistent data on the host deleted."

clean: clean_compose clean_images clean_host_data

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
	@echo "  vinit          - Initialize host directories for persistent data."
	@echo "  down           - Stop and remove the containers."
	@echo "  clean          - Stop services, remove containers, images, and volumes, and delete all persistent data on the host."
	@echo "  clean_compose  - Stop services, remove containers, images, and volumes."
	@echo "  clean_images   - Remove all Docker images."
	@echo "  clean_host_data- Remove all persistent data on the host, use with caution."
	@echo "  ps             - List the running containers."
	@echo "  log            - View the logs of every service."

.PHONY: all build vinit dev re down clean_compose clean_images clean_host_data ps log help clean
