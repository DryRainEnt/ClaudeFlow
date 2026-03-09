#!/usr/bin/env node
/**
 * SoulCube 프로토타입 - Node.js 버전
 * 3개의 Gemma 2B 모델로 분산 인지 테스트
 * Logos (논리), Pathos (감정), Ethos (윤리) 역할 분산
 */

const fetch = require('node-fetch');

class SoulCubeAgent {
    constructor(name, role, promptTemplate) {
        this.name = name;
        this.role = role;
        this.promptTemplate = promptTemplate;
        this.baseUrl = "http://localhost:11434/api/generate";
    }

    async process(userInput, hormoneState = null) {
        if (!hormoneState) {
            hormoneState = { good_bad: 0.0, tension_relaxed: 0.0, sufficient_lacking: 0.0 };
        }

        // 호르몬 상태를 프롬프트에 반영
        const hormoneContext = `
현재 감정 상태:
- 좋음/나쁨: ${hormoneState.good_bad.toFixed(1)} (-1.0=매우나쁨, 1.0=매우좋음)
- 긴장/이완: ${hormoneState.tension_relaxed.toFixed(1)} (-1.0=매우긴장, 1.0=매우이완)  
- 충분함/부족함: ${hormoneState.sufficient_lacking.toFixed(1)} (-1.0=매우부족, 1.0=매우충분)

이 감정 상태를 고려하여 답변해주세요.
`;

        const fullPrompt = this.promptTemplate
            .replace('{hormone_context}', hormoneContext)
            .replace('{user_input}', userInput);

        const startTime = Date.now();

        const payload = {
            model: "gemma2:2b",
            prompt: fullPrompt,
            stream: false
        };

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                const processingTime = (Date.now() - startTime) / 1000;

                return {
                    agent: this.name,
                    role: this.role,
                    response: result.response || "",
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
}

class SoulCubeSystem {
    constructor() {
        // 3개 인지 에이전트 초기화
        this.agents = {
            logos: new SoulCubeAgent(
                "Logos",
                "논리적 일관성 판단",
                `당신은 SoulCube의 논리(Logos) 에이전트입니다.
{hormone_context}

역할: 논리적 일관성, 목적성, 합리성을 중심으로 판단합니다.
사용자 입력: "{user_input}"

논리적 관점에서 분석하고 판단을 내려주세요.`
            ),

            pathos: new SoulCubeAgent(
                "Pathos",
                "감정적 공감 판단", 
                `당신은 SoulCube의 감정(Pathos) 에이전트입니다.
{hormone_context}

역할: 공감, 분위기, 정서적 평가를 중심으로 판단합니다.
사용자 입력: "{user_input}"

감정적, 공감적 관점에서 분석하고 판단을 내려주세요.`
            ),

            ethos: new SoulCubeAgent(
                "Ethos",
                "윤리적 신뢰성 판단",
                `당신은 SoulCube의 윤리(Ethos) 에이전트입니다.
{hormone_context}

역할: 신뢰성, 도덕성, 자기보호 판단을 중심으로 평가합니다.
사용자 입력: "{user_input}"

윤리적, 도덕적 관점에서 분석하고 판단을 내려주세요.`
            )
        };

        // 디지털 호르몬 상태
        this.hormoneState = {
            good_bad: 0.2,        // 약간 긍정적
            tension_relaxed: -0.1, // 약간 긴장
            sufficient_lacking: 0.5 // 충분함
        };
    }

    async processDistributed(userInput) {
        console.log(`🧩 SoulCube 분산 처리 시작: '${userInput}'`);
        console.log(`💉 현재 호르몬 상태:`, this.hormoneState);

        // 3개 에이전트 동시 실행
        const promises = Object.values(this.agents).map(agent => 
            agent.process(userInput, { ...this.hormoneState })
        );

        // 병렬 실행 및 결과 수집
        const results = await Promise.all(promises);

        // 결과 통합
        const integratedResponse = {
            user_input: userInput,
            hormone_state: this.hormoneState,
            agents_responses: {},
            processing_summary: {},
            timestamp: Date.now()
        };

        let totalTime = 0;
        const successfulResults = results.filter(result => !result.error);

        successfulResults.forEach(result => {
            const agentName = result.agent.toLowerCase();
            integratedResponse.agents_responses[agentName] = {
                role: result.role,
                response: result.response,
                processing_time: result.processing_time
            };
            totalTime += result.processing_time;
        });

        const maxTime = Math.max(...successfulResults.map(r => r.processing_time));
        
        integratedResponse.processing_summary = {
            total_agents: results.length,
            successful_agents: successfulResults.length,
            total_processing_time: totalTime,
            parallel_efficiency: `${(totalTime / maxTime).toFixed(1)}x`
        };

        return integratedResponse;
    }
}

async function testSoulCube() {
    console.log("🎯 SoulCube 프로토타입 테스트 시작");
    console.log("=".repeat(60));

    const system = new SoulCubeSystem();

    // 테스트 시나리오
    const testCases = [
        "오늘 날씨가 정말 좋네요!",
        "회사에서 동료와 갈등이 있어서 스트레스를 받고 있어요.",
        "새로운 프로젝트를 시작하려고 하는데 어떻게 접근하면 좋을까요?"
    ];

    for (let i = 0; i < testCases.length; i++) {
        const testInput = testCases[i];
        console.log(`\n📝 테스트 케이스 ${i + 1}: ${testInput}`);
        console.log("-".repeat(40));

        const result = await system.processDistributed(testInput);

        console.log(`⚡ 처리 요약:`);
        console.log(`  - 성공한 에이전트: ${result.processing_summary.successful_agents}/3`);
        console.log(`  - 병렬 효율성: ${result.processing_summary.parallel_efficiency}`);

        Object.entries(result.agents_responses).forEach(([agentName, responseData]) => {
            console.log(`\n🤖 ${agentName.toUpperCase()} (${responseData.role}):`);
            console.log(`  처리시간: ${responseData.processing_time.toFixed(2)}초`);
            console.log(`  응답: ${responseData.response.substring(0, 100)}...`);
        });

        console.log("\n" + "=".repeat(60));

        // 호르몬 상태 약간 변경 (다음 테스트를 위해)
        system.hormoneState.good_bad += 0.1;
        system.hormoneState.tension_relaxed -= 0.05;
    }
}

// Node.js에서 실행
if (require.main === module) {
    testSoulCube().catch(console.error);
}

module.exports = { SoulCubeSystem, SoulCubeAgent };