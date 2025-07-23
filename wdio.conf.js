const { spawn } = require('child_process');
const { resolve } = require('path');
const os = require('os');

// Keep track of tauri-driver process
let tauriDriver;

exports.config = {
    // Test specs
    specs: ['./test/e2e/**/*.spec.js'],
    
    // Capabilities
    capabilities: [{
        browserName: 'tauri',
        'tauri:options': {
            application: resolve(__dirname, 'src-tauri', 'target', 'release', 'ClaudeFlow'),
        }
    }],
    
    // Test runner configuration
    runner: 'local',
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    
    // Logging
    logLevel: 'info',
    
    // Reporters
    reporters: ['spec'],
    
    // WebDriver configuration for tauri-driver
    hostname: 'localhost',
    port: 4444,
    path: '/',
    
    // Hooks
    onPrepare: async function (config, capabilities) {
        // Make sure the app is built
        console.log('Building Tauri app...');
        const buildProcess = spawn('npm', ['run', 'tauri:build'], { 
            stdio: 'inherit',
            shell: true 
        });
        
        await new Promise((resolve, reject) => {
            buildProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Build failed with code ${code}`));
                } else {
                    resolve();
                }
            });
        });
        
        // Start tauri-driver
        console.log('Starting tauri-driver...');
        tauriDriver = spawn('tauri-driver', [], {
            stdio: ['inherit', 'inherit', 'inherit', 'ipc']
        });
        
        // Wait for driver to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
    },
    
    onComplete: async function() {
        // Kill tauri-driver process
        if (tauriDriver) {
            console.log('Stopping tauri-driver...');
            tauriDriver.kill();
        }
    }
};