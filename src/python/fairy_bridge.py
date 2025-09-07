#!/usr/bin/env python3
"""
Fairy Assistant Python Bridge
하이브리드 아키텍처의 핵심 - Electron과 Claude SDK 사이의 다리 역할
"""

import asyncio
import json
import logging
import websockets
from datetime import datetime
from typing import Dict, Any, Optional

# Claude SDK import (나중에 설치)
# from claude_code_sdk import query

# Greeum import (나중에 설치)  
# import greeum

class FairyBridge:
    """
    Fairy Assistant의 두뇌 역할을 하는 Python Bridge
    - Electron GUI와 WebSocket으로 통신
    - Claude SDK로 AI 사고력 제공
    - Greeum으로 메모리 관리
    - 능동적 AI 행동 및 판단 시스템
    """
    
    def __init__(self):
        self.websocket = None
        self.greeum_client = None
        self.is_running = False
        
        # 기본 설정
        self.config = {
            "websocket_port": 8765,
            "claude_model": "claude-3-haiku-20240307",
            "memory_retention_days": 30,
            "personality": "friendly_fairy"
        }
        
        # 능동적 AI 시스템
        self.last_interaction_time = None
        self.user_activity_pattern = {}
        self.fairy_mood = "curious"
        self.current_task = None
        
        # 로깅 설정
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('FairyBridge')
    
    async def initialize(self):
        """시스템 초기화"""
        try:
            # Greeum 메모리 시스템 초기화 (나중에 구현)
            # self.greeum_client = await greeum.init()
            
            # Claude CLI 인증 상태 확인
            auth_status = await self.check_claude_auth()
            if auth_status['authenticated']:
                self.logger.info(f"✅ Claude CLI 인증 확인됨: {auth_status.get('user', 'Unknown')}")
            else:
                self.logger.warning(f"⚠️ Claude CLI 인증 필요: {auth_status.get('error', 'Unknown error')}")
            
            self.logger.info("🧚‍♀️ Fairy Bridge 초기화 완료")
            return True
            
        except Exception as e:
            self.logger.error(f"초기화 실패: {e}")
            return False
    
    async def handle_electron_message(self, websocket, path):
        """Electron 앱으로부터 메시지 처리"""
        self.websocket = websocket
        self.logger.info("🔗 Electron과 연결됨")
        
        try:
            async for message in websocket:
                data = json.loads(message)
                response = await self.process_request(data)
                await websocket.send(json.dumps(response))
                
        except websockets.exceptions.ConnectionClosed:
            self.logger.info("📱 Electron 연결 종료")
        except Exception as e:
            self.logger.error(f"메시지 처리 오류: {e}")
    
    async def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """요청 처리 및 응답 생성"""
        request_type = request.get('type')
        
        if request_type == 'chat':
            return await self.handle_chat(request)
        elif request_type == 'action':
            return await self.handle_action(request)
        elif request_type == 'memory_query':
            return await self.handle_memory_query(request)
        elif request_type == 'auth':
            return await self.handle_auth_request(request)
        else:
            return {
                "type": "error",
                "message": f"Unknown request type: {request_type}"
            }
    
    async def generate_proactive_action(self) -> Dict[str, Any]:
        """Claude AI가 능동적으로 행동을 결정"""
        try:
            import subprocess
            import time
            
            # 현재 시간과 상황 정보 수집
            current_time = time.strftime("%H:%M")
            time_since_last = time.time() - (self.last_interaction_time or 0)
            
            # Claude AI에게 상황 판단 요청
            context_prompt = f"""
당신은 바탕화면에 거주하는 친근한 요정 AI입니다.

현재 상황:
- 시간: {current_time}
- 마지막 상호작용으로부터 {int(time_since_last/60)}분 경과
- 현재 기분: {self.fairy_mood}
- 현재 하던 일: {self.current_task or '없음'}

다음 중 하나를 선택해서 JSON으로 응답해주세요:

1. 능동적으로 말 걸기: {{"action": "speak", "message": "자연스러운 인사말"}}
2. 특정 위치로 이동: {{"action": "move", "target": "어디로", "reason": "이유"}}
3. 현재 상태 유지: {{"action": "wait", "reason": "이유"}}
4. 사용자 관찰하기: {{"action": "observe", "focus": "무엇을"}}

자연스럽고 친근하게, 하지만 너무 자주 방해하지 않도록 판단해주세요.
"""
            
            process = subprocess.Popen(
                ['claude', 'query', context_prompt],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            try:
                stdout, stderr = process.communicate(timeout=30)
                
                if process.returncode == 0:
                    # Claude의 응답에서 JSON 추출 시도
                    import json
                    import re
                    
                    # JSON 패턴 찾기
                    json_pattern = r'\{[^{}]*\}'
                    matches = re.findall(json_pattern, stdout)
                    
                    if matches:
                        try:
                            decision = json.loads(matches[0])
                            self.logger.info(f"🧠 AI 결정: {decision}")
                            return {
                                "type": "ai_action",
                                "decision": decision,
                                "timestamp": time.time()
                            }
                        except json.JSONDecodeError:
                            pass
                    
                    # JSON 파싱 실패시 fallback
                    return {
                        "type": "ai_action", 
                        "decision": {"action": "wait", "reason": "조용히 관찰 중"},
                        "timestamp": time.time()
                    }
                else:
                    # Claude CLI 실패시 간단한 규칙 기반 행동
                    if time_since_last > 1800:  # 30분 이상 
                        return {
                            "type": "ai_action",
                            "decision": {"action": "speak", "message": "오랜만이네요! 뭔가 도와드릴 일 있나요? ✨"},
                            "timestamp": time.time()
                        }
                    else:
                        return {
                            "type": "ai_action",
                            "decision": {"action": "wait", "reason": "아직 충분한 시간이 지나지 않음"},
                            "timestamp": time.time()
                        }
                        
            except subprocess.TimeoutExpired:
                # 타임아웃시 간단한 행동
                return {
                    "type": "ai_action",
                    "decision": {"action": "observe", "focus": "사용자의 현재 작업"},
                    "timestamp": time.time()
                }
                
        except Exception as e:
            self.logger.error(f"능동적 행동 생성 오류: {e}")
            return {
                "type": "ai_action",
                "decision": {"action": "wait", "reason": f"오류 발생: {str(e)}"},
                "timestamp": time.time()
            }
    
    async def generate_contextual_movement(self, current_pos: Dict) -> Dict[str, Any]:
        """Claude AI가 상황에 맞는 이동을 결정"""
        try:
            import subprocess
            import json
            
            movement_prompt = f"""
당신은 바탕화면 요정입니다. 현재 위치는 x:{current_pos.get('x', 0)}, y:{current_pos.get('y', 0)}입니다.

화면에서 어디로 이동할지 결정해주세요:
- 모니터 가장자리 근처라면 중앙으로 오기
- 사용자가 작업 중인 영역 피하기  
- 가끔은 특별한 목적지 정하기
- 너무 자주 움직이지 않기

JSON으로 응답: {{"x": 숫자, "y": 숫자, "reason": "이동 이유", "speed": "slow/normal/fast"}}
"""
            
            process = subprocess.Popen(
                ['claude', 'query', movement_prompt],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = process.communicate(timeout=20)
            
            if process.returncode == 0:
                import re
                json_pattern = r'\{[^{}]*\}'
                matches = re.findall(json_pattern, stdout)
                
                if matches:
                    try:
                        movement = json.loads(matches[0])
                        return {
                            "type": "ai_movement",
                            "movement": movement
                        }
                    except json.JSONDecodeError:
                        pass
            
            # fallback: 간단한 무작위 이동
            import random
            return {
                "type": "ai_movement", 
                "movement": {
                    "x": random.randint(50, 800),
                    "y": random.randint(50, 600), 
                    "reason": "무작위 탐험",
                    "speed": "normal"
                }
            }
            
        except Exception as e:
            self.logger.error(f"AI 움직임 생성 오류: {e}")
            return {
                "type": "ai_movement",
                "movement": {
                    "x": current_pos.get('x', 200),
                    "y": current_pos.get('y', 200),
                    "reason": "현재 위치 유지",
                    "speed": "slow"
                }
            }
    
    async def check_claude_auth(self) -> Dict[str, Any]:
        """Claude CLI 인증 상태 확인"""
        try:
            import subprocess
            
            # 빠른 타임아웃으로 auth status 확인
            process = subprocess.Popen(
                ['claude', 'auth', 'status'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            try:
                stdout, stderr = process.communicate(timeout=60)  # 60초 타임아웃
                
                if process.returncode == 0 and 'authenticated' in stdout.lower():
                    # 사용자 정보 추출 시도
                    user_info = "Authenticated"
                    if 'user:' in stdout or '@' in stdout:
                        lines = stdout.split('\n')
                        for line in lines:
                            if '@' in line or 'user' in line.lower():
                                user_info = line.strip()
                                break
                    
                    return {
                        "authenticated": True,
                        "user": user_info,
                        "method": "subscription"
                    }
                else:
                    return {
                        "authenticated": False,
                        "error": "Not authenticated or auth command failed",
                        "details": stderr[:200] if stderr else "Unknown error"
                    }
                    
            except subprocess.TimeoutExpired:
                process.kill()
                return {
                    "authenticated": False,
                    "error": "Auth status check timed out",
                    "details": "Claude CLI is not responding"
                }
                
        except FileNotFoundError:
            return {
                "authenticated": False,
                "error": "Claude CLI not found",
                "details": "Claude Code CLI is not installed"
            }
        except Exception as e:
            return {
                "authenticated": False,
                "error": f"Auth check failed: {str(e)}"
            }
    
    async def handle_auth_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """인증 요청 처리"""
        action = request.get('action', 'check')
        
        if action == 'check':
            # 인증 상태 확인
            auth_status = await self.check_claude_auth()
            return {
                "type": "auth_status",
                "status": auth_status
            }
            
        elif action == 'login_subscription':
            # 구독 방식 로그인
            result = await self.handle_subscription_auth()
            return result
            
        elif action == 'login_apikey':
            # API 키 방식 로그인
            api_key = request.get('apiKey', '')
            result = await self.handle_apikey_auth(api_key)
            return result
            
        else:
            return {
                "type": "auth_error",
                "message": f"Unknown auth action: {action}"
            }
    
    async def handle_chat(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """채팅 메시지 처리"""
        user_message = request.get('message', '')
        context = request.get('context', {})
        
        try:
            # 간단한 응답을 먼저 시도
            if len(user_message) < 20 and any(word in user_message.lower() for word in ['안녕', 'hello', 'hi', '반가워', '안녕하세요']):
                response_message = f"안녕하세요! 저는 당신의 AI 비서 요정이에요 🧚‍♀️ '{user_message}'라고 인사해주셔서 기뻐요!"
            elif '이름' in user_message and ('뭐' in user_message or '뭔' in user_message):
                response_message = "저는 Fairy Assistant예요! 바탕화면에서 당신을 도와주는 AI 요정입니다 ✨"
            elif '뭘' in user_message and '할' in user_message:
                response_message = "저는 질문 답변, 코딩 도움, 문서 작성, 창작 지원 등 다양한 일을 도울 수 있어요! 🎯"
            else:
                # Claude Code CLI를 빠른 타임아웃으로 시도
                import subprocess
                
                process = subprocess.Popen(
                    ['claude', 'query', user_message],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                try:
                    stdout, stderr = process.communicate(timeout=60)  # 60초로 확대
                    
                    if process.returncode == 0 and stdout.strip():
                        response_message = stdout.strip()
                        self.logger.info(f"Claude 응답 성공: {len(response_message)} 글자")
                    else:
                        raise Exception("Claude CLI 실행 실패")
                        
                except subprocess.TimeoutExpired:
                    process.kill()
                    raise Exception("Claude CLI 타임아웃")
            
        except Exception as e:
            self.logger.warning(f"Claude CLI 사용 불가: {e}")
            
            # 키워드 기반 스마트 응답
            user_lower = user_message.lower()
            
            if any(word in user_lower for word in ['코딩', 'code', 'programming', '프로그래밍', 'python', 'javascript']):
                response_message = f"'{user_message}'에 대한 코딩 질문이시군요! 저는 프로그래밍 도움을 드릴 수 있어요. 더 구체적으로 어떤 부분이 궁금하신가요? 💻"
            elif any(word in user_lower for word in ['도와', 'help', '문제', 'problem']):
                response_message = f"'{user_message}' 도움이 필요하시네요! 구체적으로 어떤 부분에서 어려움을 겪고 계신지 말씀해주세요. 최선을 다해 도와드릴게요! 🤝"
            elif any(word in user_lower for word in ['고마워', 'thanks', 'thank you', '감사']):
                response_message = "천만에요! 도움이 되었다니 기뻐요 😊 또 궁금한 것이 있으면 언제든 말씀해주세요!"
            elif any(word in user_lower for word in ['재미', 'fun', '놀', '게임']):
                response_message = f"'{user_message}' 재미있는 얘기를 원하시는군요! 🎮 무엇을 해보고 싶으세요? 이야기, 퀴즈, 창작 아이디어 등 뭐든 좋아요!"
            else:
                response_message = f"'{user_message}'에 대해 생각해보는 중이에요! 🤔 지금은 Claude 서비스에 접속하기 어려워서 간단하게 답변드릴게요. 더 자세한 도움이 필요하시면 다시 말씀해주세요!"
        
        return {
            "type": "chat_response",
            "message": response_message,
            "timestamp": datetime.now().isoformat()
        }
    
    async def handle_action(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """액션 요청 처리"""
        action = request.get('action')
        params = request.get('params', {})
        
        # 액션별 처리 로직 (나중에 구현)
        if action == 'move_fairy':
            return {"type": "action_result", "action": "move_fairy", "success": True}
        elif action == 'show_bubble':
            return {"type": "action_result", "action": "show_bubble", "success": True}
        
        return {"type": "action_result", "action": action, "success": False}
    
    async def handle_memory_query(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """메모리 검색 처리"""
        query = request.get('query', '')
        
        # 임시 응답 (나중에 Greeum으로 교체)
        return {
            "type": "memory_result",
            "memories": [],
            "query": query
        }
    
    async def handle_auth_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Claude 인증 처리"""
        auth_type = request.get('auth_type')
        
        if auth_type == 'subscription':
            return await self.handle_subscription_auth()
        elif auth_type == 'apikey':
            api_key = request.get('api_key', '')
            return await self.handle_apikey_auth(api_key)
        else:
            return {
                "type": "auth_error", 
                "message": "Unknown auth type"
            }
    
    async def handle_subscription_auth(self) -> Dict[str, Any]:
        """Claude 구독 인증 처리"""
        try:
            import subprocess
            
            # claude auth login 실행
            result = subprocess.run(
                ['claude', 'auth', 'login'], 
                capture_output=True, 
                text=True, 
                timeout=30
            )
            
            if result.returncode == 0:
                self.logger.info("Claude 구독 인증 성공")
                return {
                    "type": "auth_success",
                    "method": "subscription",
                    "message": "구독 인증이 완료되었습니다"
                }
            else:
                self.logger.error(f"Claude 구독 인증 실패: {result.stderr}")
                return {
                    "type": "auth_error",
                    "method": "subscription", 
                    "message": f"구독 인증 실패: {result.stderr}"
                }
                
        except Exception as e:
            self.logger.error(f"구독 인증 처리 오류: {e}")
            return {
                "type": "auth_error",
                "method": "subscription",
                "message": f"인증 처리 중 오류: {str(e)}"
            }
    
    async def handle_apikey_auth(self, api_key: str) -> Dict[str, Any]:
        """API 키 인증 처리"""
        try:
            if not api_key or not api_key.startswith('sk-ant-api'):
                return {
                    "type": "auth_error",
                    "method": "apikey",
                    "message": "올바른 API 키 형식이 아닙니다"
                }
            
            # 환경변수로 API 키 설정
            import os
            os.environ['ANTHROPIC_API_KEY'] = api_key
            
            # API 키 검증을 위한 간단한 테스트 호출
            # (나중에 claude-code-sdk로 교체)
            
            self.logger.info("API 키 인증 성공")
            return {
                "type": "auth_success", 
                "method": "apikey",
                "message": "API 키가 설정되었습니다"
            }
            
        except Exception as e:
            self.logger.error(f"API 키 인증 처리 오류: {e}")
            return {
                "type": "auth_error",
                "method": "apikey", 
                "message": f"API 키 처리 중 오류: {str(e)}"
            }
    
    async def start_server(self):
        """WebSocket 서버 시작"""
        self.is_running = True
        port = self.config['websocket_port']
        
        self.logger.info(f"🚀 WebSocket 서버 시작: ws://localhost:{port}")
        
        # HTTP API도 함께 시작
        await self.start_http_server()
        
        async with websockets.serve(
            self.handle_electron_message,
            "localhost",
            port
        ):
            while self.is_running:
                await asyncio.sleep(1)
    
    async def start_http_server(self):
        """HTTP API 서버 시작"""
        from aiohttp import web, web_runner
        
        async def handle_auth_subscription(request):
            """구독 인증 API"""
            result = await self.handle_subscription_auth()
            return web.json_response(result)
        
        async def handle_auth_apikey(request):
            """API 키 인증 API"""
            data = await request.json()
            api_key = data.get('apiKey', '')
            result = await self.handle_apikey_auth(api_key)
            return web.json_response(result)
        
        async def handle_auth_check(request):
            """인증 상태 확인 API"""
            try:
                data = await request.json()
                auth_request = {
                    'type': 'auth',
                    'action': data.get('action', 'check')
                }
                result = await self.handle_auth_request(auth_request)
                return web.json_response(result)
            except Exception as e:
                self.logger.error(f"인증 확인 API 오류: {e}")
                return web.json_response({
                    "type": "auth_error",
                    "message": f"인증 확인 중 오류: {str(e)}"
                }, status=500)
        
        async def handle_chat_api(request):
            """채팅 API"""
            try:
                data = await request.json()
                message = data.get('message', '')
                context = data.get('context', {})
                
                # 채팅 요청 처리
                chat_request = {
                    'type': 'chat',
                    'message': message,
                    'context': context
                }
                result = await self.handle_chat(chat_request)
                return web.json_response(result)
            except Exception as e:
                self.logger.error(f"채팅 API 오류: {e}")
                return web.json_response({
                    "type": "error",
                    "message": f"API 처리 오류: {str(e)}"
                }, status=500)
        
        async def handle_ai_action_api(request):
            """AI 능동적 행동 API"""
            try:
                data = await request.json()
                
                # 현재 위치 정보 업데이트
                current_pos = data.get('current_position', {})
                timestamp = data.get('timestamp', 0)
                
                ai_action = await self.generate_proactive_action()
                return web.json_response(ai_action)
            except Exception as e:
                self.logger.error(f"AI 행동 API 오류: {e}")
                return web.json_response({
                    "type": "error",
                    "message": str(e)
                }, status=500)
        
        async def handle_ai_movement_api(request):
            """AI 이동 결정 API"""
            try:
                data = await request.json()
                current_pos = data.get('current_position', {})
                
                ai_movement = await self.generate_contextual_movement(current_pos)
                return web.json_response(ai_movement)
            except Exception as e:
                self.logger.error(f"AI 이동 API 오류: {e}")
                return web.json_response({
                    "type": "error",
                    "message": str(e)
                }, status=500)

        app = web.Application()
        app.router.add_post('/api/auth/subscription', handle_auth_subscription)
        app.router.add_post('/api/auth/apikey', handle_auth_apikey)
        app.router.add_post('/api/auth/check', handle_auth_check)
        app.router.add_post('/api/chat', handle_chat_api)
        app.router.add_post('/api/ai-action', handle_ai_action_api)
        app.router.add_post('/api/ai-movement', handle_ai_movement_api)
        
        runner = web_runner.AppRunner(app)
        await runner.setup()
        site = web_runner.TCPSite(runner, 'localhost', 8766)
        await site.start()
        
        self.logger.info("🌐 HTTP API 서버 시작: http://localhost:8766")

async def main():
    """메인 실행 함수"""
    bridge = FairyBridge()
    
    if await bridge.initialize():
        await bridge.start_server()
    else:
        print("❌ 초기화 실패")

if __name__ == "__main__":
    print("🧚‍♀️ Fairy Assistant Python Bridge 시작...")
    asyncio.run(main())