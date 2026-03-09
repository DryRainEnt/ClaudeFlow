#!/usr/bin/env node
/**
 * SoulCube 프로세스 매니저
 * - 하위 프로세스들의 생명주기 관리
 * - 메인 프로세스 종료 시 모든 하위 프로세스 정리
 * - 프로세스 상태 모니터링 및 자동 재시작
 */

const { spawn, exec } = require('child_process');
const process = require('process');

class ProcessManager {
    constructor() {
        this.childProcesses = new Map(); // pid -> process info
        this.services = new Map(); // service name -> process
        this.isShuttingDown = false;
        
        // 메인 프로세스 종료 시그널 핸들링
        this.setupSignalHandlers();
        
        console.log(`🎛️ ProcessManager 초기화 완료 (PID: ${process.pid})`);
    }

    setupSignalHandlers() {
        // 정상 종료 신호들
        const signals = ['SIGTERM', 'SIGINT', 'SIGQUIT'];
        
        signals.forEach(signal => {
            process.on(signal, async () => {
                console.log(`\n📡 ${signal} 수신 - 정리 작업 시작`);
                await this.gracefulShutdown();
                process.exit(0);
            });
        });

        // 예외 상황 핸들링
        process.on('uncaughtException', async (error) => {
            console.error('💥 처리되지 않은 예외:', error);
            await this.emergencyShutdown();
            process.exit(1);
        });

        process.on('unhandledRejection', async (reason, promise) => {
            console.error('💥 처리되지 않은 Promise 거부:', reason);
            await this.emergencyShutdown();
            process.exit(1);
        });

        // 메인 프로세스 종료 감지
        process.on('exit', (code) => {
            console.log(`🔚 메인 프로세스 종료 (코드: ${code})`);
            this.killAllChildren();
        });
    }

    startService(serviceName, command, args = [], options = {}) {
        if (this.services.has(serviceName)) {
            console.warn(`⚠️ 서비스 '${serviceName}' 이미 실행 중`);
            return this.services.get(serviceName);
        }

        console.log(`🚀 서비스 시작: ${serviceName} (${command} ${args.join(' ')})`);

        const childProcess = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false, // 메인 프로세스와 함께 종료
            ...options
        });

        // 프로세스 정보 저장
        const processInfo = {
            name: serviceName,
            pid: childProcess.pid,
            command,
            args,
            process: childProcess,
            startTime: Date.now(),
            restartCount: 0,
            autoRestart: options.autoRestart !== false
        };

        this.childProcesses.set(childProcess.pid, processInfo);
        this.services.set(serviceName, processInfo);

        // 이벤트 핸들링
        childProcess.stdout.on('data', (data) => {
            console.log(`📤 [${serviceName}] ${data.toString().trim()}`);
        });

        childProcess.stderr.on('data', (data) => {
            console.log(`📥 [${serviceName}] ${data.toString().trim()}`);
        });

        childProcess.on('close', (code, signal) => {
            console.log(`🔴 서비스 종료: ${serviceName} (코드: ${code}, 시그널: ${signal})`);
            
            this.childProcesses.delete(childProcess.pid);
            this.services.delete(serviceName);

            // 자동 재시작 (정상 종료가 아닌 경우)
            if (!this.isShuttingDown && processInfo.autoRestart && code !== 0) {
                processInfo.restartCount++;
                
                if (processInfo.restartCount <= 3) {
                    console.log(`🔄 서비스 재시작 중: ${serviceName} (${processInfo.restartCount}/3)`);
                    setTimeout(() => {
                        this.startService(serviceName, command, args, options);
                    }, 2000); // 2초 후 재시작
                } else {
                    console.error(`❌ 서비스 재시작 포기: ${serviceName} (최대 재시작 횟수 초과)`);
                }
            }
        });

        childProcess.on('error', (error) => {
            console.error(`💥 서비스 오류: ${serviceName}`, error.message);
        });

        return processInfo;
    }

    stopService(serviceName, signal = 'SIGTERM') {
        const serviceInfo = this.services.get(serviceName);
        
        if (!serviceInfo) {
            console.warn(`⚠️ 서비스 '${serviceName}' 찾을 수 없음`);
            return false;
        }

        console.log(`🛑 서비스 중지: ${serviceName} (PID: ${serviceInfo.pid})`);
        
        try {
            serviceInfo.process.kill(signal);
            return true;
        } catch (error) {
            console.error(`❌ 서비스 중지 실패: ${serviceName}`, error.message);
            return false;
        }
    }

    async gracefulShutdown() {
        console.log('🔄 정상 종료 프로세스 시작...');
        this.isShuttingDown = true;

        const services = Array.from(this.services.keys());
        
        if (services.length === 0) {
            console.log('✅ 종료할 서비스 없음');
            return;
        }

        // 1. 모든 서비스에 SIGTERM 전송
        console.log(`📡 ${services.length}개 서비스에 종료 신호 전송...`);
        services.forEach(serviceName => {
            this.stopService(serviceName, 'SIGTERM');
        });

        // 2. 5초 대기
        await this.sleep(5000);

        // 3. 아직 살아있는 서비스들 강제 종료
        const remainingServices = Array.from(this.services.keys());
        if (remainingServices.length > 0) {
            console.log(`⚡ ${remainingServices.length}개 서비스 강제 종료...`);
            remainingServices.forEach(serviceName => {
                this.stopService(serviceName, 'SIGKILL');
            });
        }

        console.log('✅ 모든 서비스 정리 완료');
    }

    async emergencyShutdown() {
        console.log('🚨 비상 종료 - 모든 하위 프로세스 즉시 정리');
        this.isShuttingDown = true;
        this.killAllChildren();
    }

    killAllChildren() {
        // 등록된 모든 하위 프로세스 강제 종료
        this.childProcesses.forEach((processInfo, pid) => {
            try {
                console.log(`💀 프로세스 강제 종료: ${processInfo.name} (PID: ${pid})`);
                process.kill(pid, 'SIGKILL');
            } catch (error) {
                // 이미 종료된 프로세스일 수 있음
                console.log(`⚠️ PID ${pid} 종료 실패 (이미 종료됨?): ${error.message}`);
            }
        });

        // 추가 안전장치: pkill 명령으로 관련 프로세스들 정리
        this.cleanupOrphanedProcesses();
    }

    cleanupOrphanedProcesses() {
        // SoulCube 관련 고아 프로세스들 정리
        const cleanupCommands = [
            'pkill -f "greeum_bridge.py"',
            'pkill -f "python.*greeum"', 
            'pkill -f "ollama.*gemma"'
        ];

        cleanupCommands.forEach(cmd => {
            try {
                exec(cmd, (error, stdout, stderr) => {
                    if (!error) {
                        console.log(`🧹 정리 완료: ${cmd}`);
                    }
                });
            } catch (error) {
                // 무시 (프로세스가 없을 수 있음)
            }
        });
    }

    getServiceStatus() {
        const status = [];
        this.services.forEach((info, name) => {
            status.push({
                name,
                pid: info.pid,
                uptime: Date.now() - info.startTime,
                restartCount: info.restartCount
            });
        });
        return status;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 헬스 체크
    async healthCheck() {
        const services = this.getServiceStatus();
        
        console.log('📊 서비스 상태:');
        services.forEach(service => {
            const uptimeMin = Math.floor(service.uptime / 60000);
            console.log(`  - ${service.name}: PID ${service.pid}, 업타임 ${uptimeMin}분, 재시작 ${service.restartCount}회`);
        });

        return services;
    }
}

// 싱글톤 패턴
let processManagerInstance = null;

function getProcessManager() {
    if (!processManagerInstance) {
        processManagerInstance = new ProcessManager();
    }
    return processManagerInstance;
}

// 사용 예시
async function startSoulCubeServices() {
    const pm = getProcessManager();

    console.log('🎯 SoulCube 서비스 시작...');

    // 1. Ollama 서비스 확인/시작
    pm.startService('ollama', 'ollama', ['serve'], {
        autoRestart: true
    });

    // 잠깐 대기
    await pm.sleep(2000);

    // 2. Greeum Bridge 시작
    pm.startService('greeum-bridge', 'python3', ['greeum_bridge.py', '--port', '8767'], {
        autoRestart: true,
        cwd: '/Users/dryrain/DevRoom/ClaudeFlow'
    });

    // 3. 서비스 상태 확인
    setTimeout(() => {
        pm.healthCheck();
    }, 5000);
}

if (require.main === module) {
    // 직접 실행된 경우 테스트
    startSoulCubeServices().catch(console.error);
    
    // 10초 후 상태 확인
    setTimeout(() => {
        const pm = getProcessManager();
        pm.healthCheck();
    }, 10000);
}

module.exports = { ProcessManager, getProcessManager };