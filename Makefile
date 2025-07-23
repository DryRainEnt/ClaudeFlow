# ClaudeFlow Makefile
# Provides common build commands for convenience

.PHONY: help install dev build build-debug clean test lint format check release

# Default target
help:
	@echo "ClaudeFlow Build Commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Run in development mode"
	@echo "  make build        - Build for current platform"
	@echo "  make build-debug  - Build debug version"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run linters"
	@echo "  make format       - Format code"
	@echo "  make check        - Run all checks"
	@echo "  make release      - Build release version"

install:
	npm install

dev:
	npm run tauri:dev

build:
	npm run tauri:build

build-debug:
	npm run tauri:build:debug

clean:
	npm run clean

test:
	npm run test:rust

lint:
	npm run check

format:
	npm run format:rust

check:
	npm run check

release: check build
	@echo "Release build complete!"

# Platform-specific builds
build-windows:
	npm run tauri:build:windows

build-mac:
	npm run tauri:build:mac

build-linux:
	npm run tauri:build:linux

# Docker build for Linux
docker-build:
	docker-compose -f docker/docker-compose.yml run build-linux