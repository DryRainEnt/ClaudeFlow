# ClaudeFlow Build Guide

This guide provides comprehensive instructions for building ClaudeFlow on different platforms using various automation methods.

## Build Automation Options

### 1. GitHub Actions (Recommended for Releases)

We have configured GitHub Actions workflows for automated cross-platform builds:

- **`.github/workflows/build.yml`** - Handles releases and test builds
- **`.github/workflows/ci.yml`** - Runs linting and tests on every push/PR

#### Features:
- Automatic builds for Windows, macOS (Intel + ARM), and Linux
- Creates GitHub releases with artifacts when you push a version tag
- Runs tests on pull requests
- No local setup required for each platform

#### Usage:
```bash
# Create a new release
git tag v0.1.0
git push origin v0.1.0
# GitHub Actions will automatically build and create a release
```

### 2. Local Build Scripts

We provide several methods for building locally:

#### Quick Build Script
```bash
# Make script executable (first time only)
chmod +x scripts/build-local.sh

# Run the build
./scripts/build-local.sh
```

This script automatically detects your platform and builds accordingly.

#### NPM Scripts
```bash
# Build for current platform
npm run tauri:build

# Platform-specific builds
npm run tauri:build:windows     # Windows x64
npm run tauri:build:mac         # macOS Universal
npm run tauri:build:mac:intel   # macOS Intel only
npm run tauri:build:mac:arm     # macOS ARM only
npm run tauri:build:linux       # Linux x64
npm run tauri:build:linux:arm   # Linux ARM

# Build all platforms (only works on the respective OS)
npm run tauri:build:all
```

### 3. Docker Builds (Linux Only)

For consistent Linux builds across different environments:

```bash
# Build the Docker image
docker-compose -f docker/docker-compose.yml build

# Run the build
docker-compose -f docker/docker-compose.yml run build-linux

# For older glibc compatibility
docker-compose -f docker/docker-compose.yml run build-linux-compat
```

## Prerequisites

### All Platforms

1. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
2. **Rust**: Install from [rustup.rs](https://rustup.rs/)

### Platform-Specific Requirements

#### macOS
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Add universal build targets
rustup target add aarch64-apple-darwin x86_64-apple-darwin
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev libwebkit2gtk-4.1-dev \
    build-essential curl wget libssl-dev libgtk-3-dev \
    libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install webkit2gtk3-devel openssl-devel \
    gtk3-devel libappindicator-gtk3-devel
```

#### Windows
- Install Microsoft C++ Build Tools or Visual Studio 2022
- WebView2 (included in Windows 10/11)

## Development Workflow

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/ClaudeFlow.git
cd ClaudeFlow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Development Mode
```bash
npm run tauri:dev
```

This command:
- Starts Vite dev server with hot reload
- Builds and launches Tauri app
- Automatically recompiles on changes

### 4. Code Quality
```bash
# Run all checks
npm run check

# TypeScript check
npm run lint

# Rust linting
npm run lint:rust

# Format Rust code
npm run format:rust

# Run Rust tests
npm run test:rust
```

### 5. Clean Builds
```bash
# Clean build artifacts
npm run clean

# Clean everything including node_modules
npm run clean:all
```

## Build Output Locations

After building, find your applications here:

- **macOS**: `src-tauri/target/release/bundle/dmg/ClaudeFlow_*.dmg`
- **Windows**: `src-tauri/target/release/bundle/msi/ClaudeFlow_*.msi`
- **Linux**: 
  - AppImage: `src-tauri/target/release/bundle/appimage/claude-flow_*.AppImage`
  - Deb: `src-tauri/target/release/bundle/deb/claude-flow_*.deb`

## Troubleshooting

### Rust Issues
```bash
# Update Rust
rustup update

# Reinstall targets
rustup target add x86_64-apple-darwin      # macOS Intel
rustup target add aarch64-apple-darwin     # macOS ARM
rustup target add x86_64-pc-windows-msvc   # Windows
rustup target add x86_64-unknown-linux-gnu # Linux
```

### Node Module Issues
```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Cache Issues
```bash
# Clean Rust build cache
cd src-tauri
cargo clean
cd ..

# Rebuild
npm run tauri:build
```

### Platform-Specific Issues

#### Linux: "error while loading shared libraries"
This usually means you're missing system dependencies. Run the dependency installation commands above.

#### macOS: "Developer cannot be verified"
```bash
# Remove quarantine attribute
xattr -cr /Applications/ClaudeFlow.app
```

#### Windows: "Missing Visual C++ Redistributable"
Install the Visual C++ Redistributable from Microsoft's website.

## CI/CD Configuration

### GitHub Actions Setup

1. **Enable GitHub Actions** in your repository settings
2. **Add Repository Secrets** (if needed for code signing):
   - `APPLE_CERTIFICATE` - Base64 encoded .p12 file
   - `APPLE_CERTIFICATE_PASSWORD` - Certificate password
   - `WINDOWS_CERTIFICATE` - Base64 encoded .pfx file
   - `WINDOWS_CERTIFICATE_PASSWORD` - Certificate password

3. **Configure Workflow Permissions**:
   - Go to Settings → Actions → General
   - Set "Workflow permissions" to "Read and write permissions"

### Triggering Builds

- **Test Builds**: Push to `main` or create a PR
- **Release Builds**: Push a tag starting with `v` (e.g., `v1.0.0`)

## Advanced Configuration

### Custom Build Targets

Edit `src-tauri/tauri.conf.json` to customize:
- Bundle identifiers
- App metadata
- Build targets
- Icons and resources

### Cross-Compilation Notes

Due to native dependencies, true cross-compilation is limited:
- macOS can build for both Intel and ARM
- Linux can only build for Linux
- Windows can only build for Windows

Use GitHub Actions or virtual machines for building on other platforms.

## Additional Resources

- [Tauri Documentation](https://tauri.app/)
- [Rust Documentation](https://doc.rust-lang.org/)
- [Project Issues](https://github.com/yourusername/ClaudeFlow/issues)
- [Contributing Guide](./CONTRIBUTING.md)