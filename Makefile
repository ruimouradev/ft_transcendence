HOME := $(HOME)

include ./.env

all: secrets vinit
	docker compose -f ./docker-compose.yml up -d 

build:
	docker compose -f ./docker-compose.yml build --no-cache

vinit:
	@mkdir -p ${DBDATAPATH}
	
dev: vinit
	docker compose -f ./docker-compose.yml up db backend frontend adminer nginx

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
	sudo rm -rf $(HOME)/data
	@echo "[INFO] All persistent data on the host deleted."

clean: clean_compose clean_images clean_host_data

ps:
	docker compose -f ./docker-compose.yml ps

log:
	docker compose -f ./docker-compose.yml logs

help:
	@echo "Available Makefile targets:"
	@echo "  all            - Create and run Inception services using Docker Compose."
	@echo "  build          - Build Docker images without using cache."
	@echo "  vinit          - Initialize host directories for persistent data."
	@echo "  down           - Stop Inception services."
	@echo "  clean          - Stop services, remove containers, images, and volumes and ⚠️ delete all persistent data ⚠️"
	@echo "  clean_compose  - Stop services, remove containers, images, and volumes."
	@echo "  clean_images   - Remove all Docker images."
	@echo "  clean_host_data- ⚠️ Remove all persistent data on the host (use with caution) ⚠️"
	@echo "  ps             - List running containers for Inception services."
	@echo "  log            - View logs of Inception services."

.PHONY: all build secrets vinit down clean_compose clean_images clean_host_data ps log help clean