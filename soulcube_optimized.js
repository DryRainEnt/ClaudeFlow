#!/usr/bin/env node
/**
 * SoulCube 최적화 버전 - Greeum 메모리 + 3초 응답 + 실시간 호르몬
 * 컨텍스트 윈도우: Greeum 메모리 시스템 활용
 * 호르몬 상태: 실시간 시스템 리소스 + 감정 분석
 */

const fetch = require('node-fetch');
const os = require('os');
const { execSync } = require('child_process');

class GreeumContextManager {
    constructor() {
        // Greeum MCP 서버와의 통신을 위한 설정
        this.context_memory = [];
        this.conversation_history = [];
    }

    async addContext(userInput, agentResponses, hormoneState) {
        // 대화 컨텍스트를 Greeum에 저장
        const contextEntry = {
            timestamp: new Date().toISOString(),
            user_input: userInput,
            hormone_state: hormoneState,
            agent_responses: agentResponses,
            context_summary: this.generateContextSummary(userInput, agentResponses)
        };

        // 메모리에 추가하고 컨텍스트 윈도우 관리
        this.conversation_history.push(contextEntry);
        
        // 최근 5개 대화만 유지 (컨텍스트 윈도우)
        if (this.conversation_history.length > 5) {
            // 오래된 대화를 Greeum 장기 메모리로 이동
            const oldContext = this.conversation_history.shift();
            await this.archiveToGreeum(oldContext);
        }

        return contextEntry;
    }

    generateContextSummary(userInput, responses) {
        const emotions = this.extractEmotions(userInput);
        const topics = this.extractTopics(responses);
        return `감정: ${emotions}, 주제: ${topics}`;
    }

    extractEmotions(text) {
        const positiveWords = ['좋', '기쁘', '행복', '만족', '즐거'];
        const negativeWords = ['나쁘', '슬프', '화나', '스트레스', '걱정'];
        
        let score = 0;
        positiveWords.forEach(word => {
            if (text.includes(word)) score += 1;
        });
        negativeWords.forEach(word => {
            if (text.includes(word)) score -= 1;
        });
        
        if (score > 0) return '긍정적';
        if (score < 0) return '부정적';
        return '중립적';
    }

    extractTopics(responses) {
        const allText = Object.values(responses).map(r => r.response).join(' ');
        if (allText.includes('프로젝트') || allText.includes('업무')) return '업무';
        if (allText.includes('감정') || allText.includes('기분')) return '감정';
        if (allText.includes('날씨')) return '일상';
        return '일반';
    }

    async getRelevantContext(currentInput) {
        // 현재 입력과 관련된 과거 컨텍스트 검색
        const relevantContexts = this.conversation_history.filter(context => {
            const similarity = this.calculateSimilarity(currentInput, context.user_input);
            return similarity > 0.3; // 30% 이상 유사하면 관련 컨텍스트로 판단
        });

        return relevantContexts.slice(-3); // 최근 3개의 관련 컨텍스트 반환
    }

    calculateSimilarity(text1, text2) {
        // 간단한 단어 기반 유사도 계산
        const words1 = text1.split(' ');
        const words2 = text2.split(' ');
        const commonWords = words1.filter(word => words2.includes(word));
        return commonWords.length / Math.max(words1.length, words2.length);
    }

    async archiveToGreeum(context) {
        // 실제 Greeum MCP 서버 연동
        console.log(`📚 Greeum 장기 메모리 저장: ${context.context_summary}`);
        
        // MCP 함수 호출은 현재 Claude Code 환경에서만 가능
        // Node.js에서는 HTTP API 형태로 MCP 서버와 통신해야 함
        // 실제 구현 시에는 별도 MCP 클라이언트 필요
        
        const memoryContent = `SoulCube 대화: ${context.user_input} → ${context.context_summary} (${context.timestamp})`;
        console.log(`📝 메모리 내용: ${memoryContent}`);
        
        // TODO: MCP 클라이언트 구현 또는 HTTP API 호출
        return true;
    }
}

class SystemResourceMonitor {
    constructor() {
        this.cpuUsageHistory = [];
        this.memoryUsageHistory = [];
        this.maxHistoryLength = 10; // 최근 10개 측정치 유지
    }

    getCurrentMetrics() {
        try {
            // CPU 사용률 (macOS)
            const cpuUsage = this.getCpuUsage();
            
            // 메모리 사용률
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
            
            // 배터리 레벨 (macOS)
            const batteryLevel = this.getBatteryLevel();

            // 히스토리 업데이트
            this.cpuUsageHistory.push(cpuUsage);
            this.memoryUsageHistory.push(memoryUsage);
            
            if (this.cpuUsageHistory.length > this.maxHistoryLength) {
                this.cpuUsageHistory.shift();
                this.memoryUsageHistory.shift();
            }

            return {
                currentCpuUsage: cpuUsage,
                currentMemoryUsage: memoryUsage,
                avgCpuUsage: this.cpuUsageHistory.reduce((a, b) => a + b, 0) / this.cpuUsageHistory.length,
                avgMemUsage: this.memoryUsageHistory.reduce((a, b) => a + b, 0) / this.memoryUsageHistory.length,
                availableRAM: (freeMem / totalMem) * 100,
                batteryLevel: batteryLevel,
                timestamp: Date.now()
            };
        } catch (error) {
            console.warn('⚠️ 시스템 메트릭 수집 실패, 기본값 사용');
            return {
                currentCpuUsage: 50,
                currentMemoryUsage: 60,
                avgCpuUsage: 50,
                avgMemUsage: 60,
                availableRAM: 70,
                batteryLevel: 80,
                timestamp: Date.now()
            };
        }
    }

    getCpuUsage() {
        try {
            // macOS top 명령어로 CPU 사용률 확인
            const topOutput = execSync('top -l 1 -n 0 | grep "CPU usage"', { encoding: 'utf8', timeout: 1000 });
            const match = topOutput.match(/(\d+\.\d+)%\s+user/);
            return match ? parseFloat(match[1]) : 50;
        } catch {
            return 50; // 기본값
        }
    }

    getBatteryLevel() {
        try {
            // macOS pmset 명령어로 배터리 확인
            const batteryOutput = execSync('pmset -g batt', { encoding: 'utf8', timeout: 1000 });
            const match = batteryOutput.match(/(\d+)%/);
            return match ? parseInt(match[1]) : 80;
        } catch {
            return 80; // 기본값
        }
    }
}

class OptimizedSoulCubeAgent {
    constructor(name, role, promptTemplate) {
        this.name = name;
        this.role = role;
        this.promptTemplate = promptTemplate;
        this.baseUrl = "http://localhost:11434/api/generate";
    }

    async processOptimized(userInput, hormoneState, relevantContext = []) {
        // 컨텍스트 요약을 통한 프롬프트 최적화
        const contextSummary = this.buildContextSummary(relevantContext);
        
        const optimizedPrompt = this.promptTemplate
            .replace('{hormone_context}', this.buildHormoneContext(hormoneState))
            .replace('{context_summary}', contextSummary)
            .replace('{user_input}', userInput);

        const startTime = Date.now();

        const payload = {
            model: "gemma2:2b",
            prompt: optimizedPrompt,
            stream: false,
            options: {
                num_predict: 100,  // 토큰 제한으로 응답 시간 단축
                temperature: 0.7,
                top_p: 0.9
            }
        };

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                timeout: 4000  // 4초 타임아웃
            });

            if (response.ok) {
                const result = await response.json();
                const processingTime = (Date.now() - startTime) / 1000;

                return {
                    agent: this.name,
                    role: this.role,
                    response: result.response || "",
                    processing_time: processingTime,
                    hormone_influence: hormoneState,
                    context_used: relevantContext.length
                };
            } else {
                return { agent: this.name, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            return { agent: this.name, error: error.message };
        }
    }

    buildHormoneContext(hormoneState) {
        return `[감정상태] 좋음/나쁨:${hormoneState.good_bad.toFixed(1)} 긴장/이완:${hormoneState.tension_relaxed.toFixed(1)} 충분/부족:${hormoneState.sufficient_lacking.toFixed(1)}`;
    }

    buildContextSummary(contexts) {
        if (contexts.length === 0) return '[첫 대화]';
        
        const summaries = contexts.map(ctx => ctx.context_summary);
        return `[이전맥락: ${summaries.join(', ')}]`;
    }
}

class OptimizedSoulCubeSystem {
    constructor() {
        this.contextManager = new GreeumContextManager();
        this.resourceMonitor = new SystemResourceMonitor();
        
        // 최적화된 에이전트 (더 짧은 프롬프트)
        this.agents = {
            logos: new OptimizedSoulCubeAgent("Logos", "논리", 
                `논리 에이전트: {hormone_context} {context_summary} 입력: "{user_input}" → 논리적 분석 (간결하게):`),
            pathos: new OptimizedSoulCubeAgent("Pathos", "감정",
                `감정 에이전트: {hormone_context} {context_summary} 입력: "{user_input}" → 공감적 응답 (따뜻하게):`),
            ethos: new OptimizedSoulCubeAgent("Ethos", "윤리",
                `윤리 에이전트: {hormone_context} {context_summary} 입력: "{user_input}" → 윤리적 판단 (신중하게):`)
        };
    }

    calculateRealtimeHormones(userInput, systemMetrics) {
        // 1. 좋음-나쁨: 감정 분석 기반
        const emotionScore = this.contextManager.extractEmotions(userInput);
        let good_bad = 0;
        if (emotionScore === '긍정적') good_bad = 0.6;
        else if (emotionScore === '부정적') good_bad = -0.4;
        else good_bad = 0.1;

        // 2. 충분-부족: 실제 시스템 리소스
        const resourceScore = (systemMetrics.availableRAM + systemMetrics.batteryLevel) / 2;
        const sufficient_lacking = (resourceScore / 100) * 2 - 1; // 0-100% → -1~1

        // 3. 긴장-이완: CPU/메모리 평균 사용률
        const stressLevel = (systemMetrics.avgCpuUsage + systemMetrics.avgMemUsage) / 2;
        const tension_relaxed = 1 - (stressLevel / 100) * 2; // 사용률 높으면 긴장

        return {
            good_bad: Math.max(-1, Math.min(1, good_bad)),
            tension_relaxed: Math.max(-1, Math.min(1, tension_relaxed)), 
            sufficient_lacking: Math.max(-1, Math.min(1, sufficient_lacking))
        };
    }

    async processOptimized(userInput) {
        console.log(`🚀 최적화된 SoulCube 처리: '${userInput}'`);
        
        // 1. 시스템 메트릭 수집
        const systemMetrics = this.resourceMonitor.getCurrentMetrics();
        console.log(`💻 시스템 상태: CPU ${systemMetrics.avgCpuUsage.toFixed(1)}%, MEM ${systemMetrics.avgMemUsage.toFixed(1)}%, BAT ${systemMetrics.batteryLevel}%`);

        // 2. 실시간 호르몬 계산
        const hormoneState = this.calculateRealtimeHormones(userInput, systemMetrics);
        console.log(`💉 호르몬 상태:`, hormoneState);

        // 3. 관련 컨텍스트 검색 (Greeum)
        const relevantContext = await this.contextManager.getRelevantContext(userInput);
        console.log(`🧠 관련 컨텍스트: ${relevantContext.length}개`);

        // 4. 3개 에이전트 병렬 처리 (최적화됨)
        const startTime = Date.now();
        const promises = Object.values(this.agents).map(agent => 
            agent.processOptimized(userInput, hormoneState, relevantContext)
        );

        const results = await Promise.all(promises);
        const totalProcessingTime = (Date.now() - startTime) / 1000;

        // 5. 결과 처리 및 컨텍스트 저장
        const agentResponses = {};
        const successfulResults = results.filter(r => !r.error);

        successfulResults.forEach(result => {
            agentResponses[result.agent.toLowerCase()] = {
                role: result.role,
                response: result.response,
                processing_time: result.processing_time
            };
        });

        // 6. Greeum에 컨텍스트 저장
        await this.contextManager.addContext(userInput, agentResponses, hormoneState);

        console.log(`⚡ 총 처리시간: ${totalProcessingTime.toFixed(2)}초`);
        
        return {
            user_input: userInput,
            processing_time: totalProcessingTime,
            hormone_state: hormoneState,
            system_metrics: systemMetrics,
            agents_responses: agentResponses,
            context_used: relevantContext.length,
            success: totalProcessingTime <= 3.0
        };
    }
}

async function testOptimizedSoulCube() {
    console.log("🎯 최적화된 SoulCube 테스트 (목표: 3초 이내)");
    console.log("=" * 60);

    const system = new OptimizedSoulCubeSystem();

    const testCases = [
        "오늘 기분이 좋아요!",
        "컴퓨터가 느려서 답답해요",
        "새로운 아이디어가 있어요"
    ];

    for (let i = 0; i < testCases.length; i++) {
        console.log(`\n📝 테스트 ${i + 1}: ${testCases[i]}`);
        console.log("-" * 40);

        const result = await system.processOptimized(testCases[i]);

        console.log(`⏱️ 처리시간: ${result.processing_time.toFixed(2)}초 ${result.success ? '✅' : '❌'}`);
        console.log(`🧠 컨텍스트: ${result.context_used}개 활용`);
        
        Object.entries(result.agents_responses).forEach(([name, data]) => {
            console.log(`${name}: "${data.response.substring(0, 50)}..." (${data.processing_time.toFixed(2)}초)`);
        });

        console.log("=" * 60);
        
        // 시스템 부하 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

if (require.main === module) {
    testOptimizedSoulCube().catch(console.error);
}

module.exports = { OptimizedSoulCubeSystem };