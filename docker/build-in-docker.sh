#!/bin/bash

# Build script for running inside Docker container

set -e

echo "Building ClaudeFlow in Docker container..."

# Install npm dependencies
echo "Installing dependencies..."
npm ci

# Build the application
echo "Building application..."
npm run tauri:build:linux

echo "Build complete!"
echo "Artifacts are in src-tauri/target/release/bundle/"

# Copy artifacts to output directory if specified
if [ -n "$OUTPUT_DIR" ]; then
    echo "Copying artifacts to $OUTPUT_DIR..."
    mkdir -p "$OUTPUT_DIR"
    cp -r src-tauri/target/release/bundle/* "$OUTPUT_DIR/"
fi