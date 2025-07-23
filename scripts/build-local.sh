#!/bin/bash

echo "🚀 ClaudeFlow Local Build Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    OS="windows"
fi

echo -e "Detected OS: ${GREEN}$OS${NC}"

# Check dependencies
echo -e "\n${YELLOW}Checking dependencies...${NC}"
node scripts/check-deps.js
if [ $? -ne 0 ]; then
    echo -e "${RED}Dependency check failed!${NC}"
    exit 1
fi

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "\n${YELLOW}Installing npm dependencies...${NC}"
    npm install
fi

# Clean previous builds
echo -e "\n${YELLOW}Cleaning previous builds...${NC}"
rm -rf src-tauri/target/release/bundle

# Build the app
echo -e "\n${YELLOW}Building ClaudeFlow...${NC}"

case $OS in
    "macos")
        echo "Building for macOS (universal binary)..."
        npm run tauri:build:mac
        ;;
    "linux")
        echo "Building for Linux..."
        npm run tauri:build:linux
        ;;
    "windows")
        echo "Building for Windows..."
        npm run tauri:build:windows
        ;;
    *)
        echo -e "${RED}Unsupported OS: $OS${NC}"
        exit 1
        ;;
esac

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Build completed successfully!${NC}"
    echo -e "\nOutput location:"
    
    case $OS in
        "macos")
            echo "  DMG: src-tauri/target/release/bundle/dmg/"
            echo "  App: src-tauri/target/release/bundle/macos/"
            ;;
        "linux")
            echo "  AppImage: src-tauri/target/release/bundle/appimage/"
            echo "  Deb: src-tauri/target/release/bundle/deb/"
            ;;
        "windows")
            echo "  MSI: src-tauri/target/release/bundle/msi/"
            echo "  EXE: src-tauri/target/release/"
            ;;
    esac
else
    echo -e "\n${RED}❌ Build failed!${NC}"
    exit 1
fi