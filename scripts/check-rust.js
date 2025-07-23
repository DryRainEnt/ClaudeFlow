#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log('Checking Rust installation...');

try {
  const rustVersion = execSync('rustc --version', { encoding: 'utf8' }).trim();
  const cargoVersion = execSync('cargo --version', { encoding: 'utf8' }).trim();
  
  console.log(chalk.green('✓'), 'Rust is installed:', rustVersion);
  console.log(chalk.green('✓'), 'Cargo is installed:', cargoVersion);
  
  // Check if we have the required target
  const targets = execSync('rustup target list --installed', { encoding: 'utf8' });
  console.log(chalk.blue('ℹ'), 'Installed targets:');
  console.log(targets);
  
} catch (error) {
  console.error(chalk.red('✗'), 'Rust is not installed!');
  console.log('\nTo install Rust, run:');
  console.log(chalk.yellow('curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh'));
  console.log('\nOr visit: https://www.rust-lang.org/tools/install');
  console.log('\nAfter installation, restart your terminal and run:');
  console.log(chalk.yellow('npm install'));
  process.exit(1);
}