#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 Checking build dependencies...\n');

const platform = os.platform();
let hasErrors = false;

// Check Node.js version
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion >= 18) {
    console.log('✅ Node.js:', nodeVersion);
  } else {
    console.error('❌ Node.js version 18 or higher required. Current:', nodeVersion);
    hasErrors = true;
  }
} catch (e) {
  console.error('❌ Failed to check Node.js version');
  hasErrors = true;
}

// Check Rust
try {
  const rustVersion = execSync('rustc --version', { encoding: 'utf8' }).trim();
  console.log('✅ Rust:', rustVersion);
  
  // Check Tauri CLI
  try {
    execSync('cargo tauri --version', { encoding: 'utf8' });
    console.log('✅ Tauri CLI is installed');
  } catch {
    console.log('⚠️  Tauri CLI not found, will be installed via npm');
  }
} catch (e) {
  console.error('❌ Rust is not installed!');
  console.log('   Install from: https://www.rust-lang.org/tools/install');
  hasErrors = true;
}

// Platform-specific checks
console.log('\n📦 Platform-specific dependencies:');
console.log('Platform:', platform);

if (platform === 'linux') {
  const requiredPackages = [
    { cmd: 'pkg-config --version', name: 'pkg-config' },
    { cmd: 'dpkg -l | grep libgtk-3-dev', name: 'libgtk-3-dev' },
    { cmd: 'dpkg -l | grep libwebkit2gtk-4.0-dev', name: 'libwebkit2gtk-4.0-dev' },
  ];
  
  console.log('\nRequired packages for Linux:');
  requiredPackages.forEach(pkg => {
    try {
      execSync(pkg.cmd, { encoding: 'utf8', stdio: 'ignore' });
      console.log(`✅ ${pkg.name}`);
    } catch {
      console.error(`❌ ${pkg.name} - Run: sudo apt-get install ${pkg.name}`);
      hasErrors = true;
    }
  });
} else if (platform === 'darwin') {
  try {
    execSync('xcode-select -p', { encoding: 'utf8', stdio: 'ignore' });
    console.log('✅ Xcode Command Line Tools');
  } catch {
    console.error('❌ Xcode Command Line Tools - Run: xcode-select --install');
    hasErrors = true;
  }
} else if (platform === 'win32') {
  console.log('✅ Windows - WebView2 is included in Windows 10/11');
  console.log('ℹ️  Make sure you have Visual Studio Build Tools or VS 2019+ installed');
}

// Check if node_modules exists
if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
  console.log('\n⚠️  node_modules not found. Run: npm install');
  hasErrors = true;
}

console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('\n❌ Some dependencies are missing. Please install them before building.');
  process.exit(1);
} else {
  console.log('\n✅ All dependencies are satisfied! Ready to build.');
}