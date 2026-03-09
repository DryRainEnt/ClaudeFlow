#!/usr/bin/env node
/**
 * SoulCube + 실제 Greeum API 통합 버전
 * - 실제 Greeum Python API 연동 (HTTP 브릿지 사용)
 * - 3초 응답 목표
 * - 실시간 시스템 리소스 기반 호르몬 시스템
 */

const fetch = require('node-fetch');
const os = require('os');
const { execSync } = require('child_process');

class RealGreeumContextManager {
    constructor() {
        this.greeumApiBase = "http://localhost:8767/api";
        this.conversation_history = [];
        this.maxLocalHistory = 3; // 로컬에 최근 3개만 유지, 나머지는 Greeum으로
    }

    async addContext(userInput, agentResponses, hormoneState) {
        console.log(`🧠 Greeum에 컨텍스트 저장 중...`);
        
        const contextEntry = {
            timestamp: new Date().toISOString(),
            user_input: userInput,
            hormone_state: hormoneState,
            agent_responses: agentResponses,
            context_summary: this.generateContextSummary(userInput, agentResponses)
        };

        // 로컬 히스토리에 추가
        this.conversation_history.push(contextEntry);

        // 로컬 히스토리가 3개를 초과하면 Greeum에 저장
        if (this.conversation_history.length > this.maxLocalHistory) {
            const oldContext = this.conversation_history.shift();
            await this.saveToGreeum(oldContext);
        }

        return contextEntry;
    }

    async saveToGreeum(context) {
        try {
            const response = await fetch(`${this.greeumApiBase}/memory/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: `SoulCube 대화: ${context.user_input} → ${context.context_summary}`,
                    keywords: this.extractKeywords(context.user_input),
                    tags: ["soulcube", "conversation", this.extractEmotions(context.user_input)],
                    importance: this.calculateImportance(context)
                }),
                timeout: 2000
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Greeum 저장 성공: ${context.context_summary}`);
                return result;
            } else {
                console.warn(`⚠️ Greeum 저장 실패: ${response.status}`);
                return null;
            }
        } catch (error) {
            console.warn(`⚠️ Greeum 연결 실패: ${error.message}`);
            return null;
        }
    }

    async searchGreeumMemories(query) {
        try {
            const response = await fetch(`${this.greeumApiBase}/memory/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query,
                    limit: 3
                }),
                timeout: 1500
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`🔍 Greeum 검색 완료: ${result.count}개 결과`);
                return result.results || [];
            }
        } catch (error) {
            console.warn(`⚠️ Greeum 검색 실패: ${error.message}`);
        }
        return [];
    }

    async getRelevantContext(currentInput) {
        // 1. 로컬 히스토리에서 관련 컨텍스트 찾기
        const localContexts = this.conversation_history.filter(context => {
            const similarity = this.calculateSimilarity(currentInput, context.user_input);
            return similarity > 0.3;
        });

        // 2. Greeum에서 관련 메모리 검색
        const greeumMemories = await this.searchGreeumMemories(currentInput);

        // 3. 결합하여 반환
        const combinedContext = [
            ...localContexts.slice(-2), // 최근 2개 로컬 컨텍스트
            ...greeumMemories.map(memory => ({
                context_summary: memory.context,
                user_input: memory.context,
                from_greeum: true
            })).slice(0, 2) // 최대 2개 Greeum 메모리
        ];

        console.log(`📚 컨텍스트: 로컬 ${localContexts.length}개 + Greeum ${greeumMemories.length}개`);
        return combinedContext;
    }

    generateContextSummary(userInput, responses) {
        const emotions = this.extractEmotions(userInput);
        const topics = this.extractTopics(responses);
        return `감정:${emotions} 주제:${topics}`;
    }

    extractKeywords(text) {
        // 간단한 키워드 추출
        const words = text.split(/\s+/).filter(word => word.length > 2);
        return words.slice(0, 5); // 최대 5개 키워드
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
        
        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }

    extractTopics(responses) {
        const allText = Object.values(responses).map(r => r.response).join(' ');
        if (allText.includes('프로젝트') || allText.includes('업무')) return 'work';
        if (allText.includes('감정') || allText.includes('기분')) return 'emotion';
        if (allText.includes('날씨')) return 'daily';
        return 'general';
    }

    calculateSimilarity(text1, text2) {
        const words1 = text1.split(' ');
        const words2 = text2.split(' ');
        const commonWords = words1.filter(word => words2.includes(word));
        return commonWords.length / Math.max(words1.length, words2.length);
    }

    calculateImportance(context) {
        // 감정이 강하거나 특별한 주제면 중요도 높게
        let importance = 0.5;
        
        if (context.context_summary.includes('negative')) importance += 0.2;
        if (context.context_summary.includes('positive')) importance += 0.1;
        if (context.context_summary.includes('work')) importance += 0.2;
        
        return Math.min(1.0, importance);
    }
}

// 기존 SystemResourceMonitor와 OptimizedSoulCubeAgent는 동일하게 유지
class SystemResourceMonitor {
    constructor() {
        this.cpuUsageHistory = [];
        this.memoryUsageHistory = [];
        this.maxHistoryLength = 5; // 더 짧은 히스토리 (성능 최적화)
    }

    getCurrentMetrics() {
        try {
            const cpuUsage = this.getCpuUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
            const batteryLevel = this.getBatteryLevel();

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
            return {
                currentCpuUsage: 40, avgCpuUsage: 40, currentMemoryUsage: 60,
                avgMemUsage: 60, availableRAM: 70, batteryLevel: 85, timestamp: Date.now()
            };
        }
    }

    getCpuUsage() {
        try {
            const topOutput = execSync('top -l 1 -n 0 | grep "CPU usage"', { 
                encoding: 'utf8', timeout: 500 
            });
            const match = topOutput.match(/(\d+\.\d+)%\s+user/);
            return match ? parseFloat(match[1]) : 40;
        } catch { return 40; }
    }

    getBatteryLevel() {
        try {
            const batteryOutput = execSync('pmset -g batt', { encoding: 'utf8', timeout: 500 });
            const match = batteryOutput.match(/(\d+)%/);
            return match ? parseInt(match[1]) : 85;
        } catch { return 85; }
    }
}

class UltraOptimizedSoulCubeAgent {
    constructor(name, role, promptTemplate) {
        this.name = name;
        this.role = role;
        this.promptTemplate = promptTemplate;
        this.baseUrl = "http://localhost:11434/api/generate";
    }

    async processUltraFast(userInput, hormoneState, relevantContext = []) {
        const contextSummary = relevantContext.length > 0 
            ? `[이전: ${relevantContext.slice(-2).map(c => c.context_summary || c.user_input.substring(0,20)).join(', ')}]` 
            : '[첫대화]';
        
        const ultraShortPrompt = `${this.role}: ${this.buildHormoneContext(hormoneState)} ${contextSummary} "${userInput}" → 간단 응답:`;

        const startTime = Date.now();

        const payload = {
            model: "gemma2:2b",
            prompt: ultraShortPrompt,
            stream: false,
            options: {
                num_predict: 50,      // 50 토큰으로 제한
                temperature: 0.5,     // 더 빠른 추론
                top_p: 0.8,
                stop: ["\n", ".", "!", "?"]  // 짧은 문장으로 끝내기
            }
        };

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                timeout: 2500  // 2.5초 타임아웃
            });

            if (response.ok) {
                const result = await response.json();
                const processingTime = (Date.now() - startTime) / 1000;

                return {
                    agent: this.name,
                    role: this.role,
                    response: (result.response || "").trim(),
                    processing_time: processingTime,
                    hormone_influence: hormoneState
                };
            } else {
                return { agent: this.name, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            return { agent: this.name, error: error.message };
        }
    }

    buildHormoneContext(hormoneState) {
        return `[기분:${hormoneState.good_bad.toFixed(1)} 긴장:${hormoneState.tension_relaxed.toFixed(1)} 자원:${hormoneState.sufficient_lacking.toFixed(1)}]`;
    }
}

class GreeumIntegratedSoulCube {
    constructor() {
        this.contextManager = new RealGreeumContextManager();
        this.resourceMonitor = new SystemResourceMonitor();
        
        // 초단순 에이전트 (3초 목표)
        this.agents = {
            pathos: new UltraOptimizedSoulCubeAgent("Pathos", "공감", ""),
            logos: new UltraOptimizedSoulCubeAgent("Logos", "논리", ""),
            ethos: new UltraOptimizedSoulCubeAgent("Ethos", "윤리", "")
        };
    }

    calculateRealtimeHormones(userInput, systemMetrics) {
        const emotionScore = this.contextManager.extractEmotions(userInput);
        let good_bad = 0;
        if (emotionScore === 'positive') good_bad = 0.7;
        else if (emotionScore === 'negative') good_bad = -0.4;
        else good_bad = 0.1;

        const resourceScore = (systemMetrics.availableRAM + systemMetrics.batteryLevel) / 2;
        const sufficient_lacking = (resourceScore / 100) * 2 - 1;

        const stressLevel = (systemMetrics.avgCpuUsage + systemMetrics.avgMemUsage) / 2;
        const tension_relaxed = 1 - (stressLevel / 100) * 2;

        return {
            good_bad: Math.max(-1, Math.min(1, good_bad)),
            tension_relaxed: Math.max(-1, Math.min(1, tension_relaxed)), 
            sufficient_lacking: Math.max(-1, Math.min(1, sufficient_lacking))
        };
    }

    async processWithGreeum(userInput) {
        console.log(`🚀 Greeum 통합 SoulCube: '${userInput}'`);
        const overallStart = Date.now();
        
        // 1. 시스템 메트릭 & 호르몬 계산 (병렬)
        const [systemMetrics, relevantContext] = await Promise.all([
            Promise.resolve(this.resourceMonitor.getCurrentMetrics()),
            this.contextManager.getRelevantContext(userInput)
        ]);
        
        const hormoneState = this.calculateRealtimeHormones(userInput, systemMetrics);
        
        console.log(`💻 시스템: CPU ${systemMetrics.avgCpuUsage.toFixed(1)}% MEM ${systemMetrics.avgMemUsage.toFixed(1)}% BAT ${systemMetrics.batteryLevel}%`);
        console.log(`💉 호르몬:`, Object.entries(hormoneState).map(([k,v]) => `${k}:${v.toFixed(1)}`).join(' '));

        // 2. 3개 에이전트 병렬 초고속 처리
        const promises = Object.values(this.agents).map(agent => 
            agent.processUltraFast(userInput, hormoneState, relevantContext)
        );

        const results = await Promise.all(promises);
        const totalProcessingTime = (Date.now() - overallStart) / 1000;

        // 3. 결과 처리
        const agentResponses = {};
        const successfulResults = results.filter(r => !r.error);

        successfulResults.forEach(result => {
            agentResponses[result.agent.toLowerCase()] = {
                role: result.role,
                response: result.response,
                processing_time: result.processing_time
            };
        });

        // 4. Greeum에 비동기 저장 (응답 시간에 영향 없음)
        this.contextManager.addContext(userInput, agentResponses, hormoneState)
            .catch(err => console.warn(`Greeum 저장 실패: ${err.message}`));

        console.log(`⚡ 총 처리시간: ${totalProcessingTime.toFixed(2)}초 ${totalProcessingTime <= 3.0 ? '✅' : '❌'}`);
        
        return {
            user_input: userInput,
            processing_time: totalProcessingTime,
            hormone_state: hormoneState,
            agents_responses: agentResponses,
            context_used: relevantContext.length,
            greeum_integrated: true,
            success: totalProcessingTime <= 3.0
        };
    }
}

async function testGreeumIntegrated() {
    console.log("🎯 Greeum 통합 SoulCube 테스트 (목표: 3초)");
    console.log("=" * 60);

    const system = new GreeumIntegratedSoulCube();

    const testCases = [
        "정말 기분이 좋아요!",
        "스트레스가 심해요",
        "새 프로젝트가 고민이에요"
    ];

    for (let i = 0; i < testCases.length; i++) {
        console.log(`\n📝 테스트 ${i + 1}: ${testCases[i]}`);
        console.log("-" * 40);

        const result = await system.processWithGreeum(testCases[i]);

        console.log(`⏱️ ${result.processing_time.toFixed(2)}초 ${result.success ? '✅ 성공' : '❌ 실패'}`);
        console.log(`🧠 컨텍스트: ${result.context_used}개`);
        
        Object.entries(result.agents_responses).forEach(([name, data]) => {
            console.log(`${name}: "${data.response}" (${data.processing_time.toFixed(2)}초)`);
        });

        console.log("=" * 60);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

if (require.main === module) {
    testGreeumIntegrated().catch(console.error);
}

module.exports = { GreeumIntegratedSoulCube };