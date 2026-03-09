#!/usr/bin/env python3
"""
Greeum Bridge - Node.js에서 Greeum API를 사용하기 위한 Python 브릿지
HTTP API 서버로 Greeum 기능들을 노출
"""

import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
from greeum import BlockManager, DatabaseManager
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GreeumBridge:
    def __init__(self):
        self.db_manager = DatabaseManager()
        self.memory = BlockManager(self.db_manager)
        logger.info("🧠 Greeum Bridge 초기화 완료")
    
    def add_memory(self, context, keywords=None, tags=None, importance=0.5):
        """메모리 블록 추가"""
        try:
            if keywords is None:
                keywords = []
            if tags is None:
                tags = []
                
            block = self.memory.add_block(
                context=context,
                keywords=keywords,
                tags=tags,
                importance=importance
            )
            
            return {
                "success": True,
                "block_id": block.id if hasattr(block, 'id') else None,
                "context": context,
                "keywords": keywords,
                "tags": tags,
                "importance": importance
            }
        except Exception as e:
            logger.error(f"메모리 추가 실패: {e}")
            return {"success": False, "error": str(e)}
    
    def search_memory(self, query, limit=5):
        """메모리 검색"""
        try:
            results = self.memory.search_memories(query, limit=limit)
            
            # 결과를 JSON 직렬화 가능한 형태로 변환
            formatted_results = []
            for result in results:
                formatted_result = {
                    "context": result.context if hasattr(result, 'context') else str(result),
                    "keywords": result.keywords if hasattr(result, 'keywords') else [],
                    "tags": result.tags if hasattr(result, 'tags') else [],
                    "importance": result.importance if hasattr(result, 'importance') else 0.5,
                    "relevance_score": getattr(result, 'score', 0.0)
                }
                formatted_results.append(formatted_result)
            
            return {
                "success": True,
                "query": query,
                "results": formatted_results,
                "count": len(formatted_results)
            }
        except Exception as e:
            logger.error(f"메모리 검색 실패: {e}")
            return {"success": False, "error": str(e)}
    
    def get_stats(self):
        """메모리 시스템 통계"""
        try:
            # DatabaseManager에서 통계 정보 추출
            stats = {
                "success": True,
                "total_blocks": 0,  # 실제 구현시 DB에서 카운트
                "system_status": "operational",
                "version": "greeum-2.4.0b1"
            }
            return stats
        except Exception as e:
            logger.error(f"통계 조회 실패: {e}")
            return {"success": False, "error": str(e)}

# HTTP API 서버
class GreeumAPIHandler(BaseHTTPRequestHandler):
    greeum_bridge = None
    
    def _send_json_response(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        """CORS preflight 처리"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """POST 요청 처리"""
        path = urlparse(self.path).path
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
        except Exception as e:
            self._send_json_response({"error": f"Invalid JSON: {e}"}, 400)
            return
        
        if path == '/api/memory/add':
            response = self.greeum_bridge.add_memory(
                context=data.get('context', ''),
                keywords=data.get('keywords', []),
                tags=data.get('tags', []),
                importance=data.get('importance', 0.5)
            )
            self._send_json_response(response)
        
        elif path == '/api/memory/search':
            response = self.greeum_bridge.search_memory(
                query=data.get('query', ''),
                limit=data.get('limit', 5)
            )
            self._send_json_response(response)
        
        else:
            self._send_json_response({"error": "Not found"}, 404)
    
    def do_GET(self):
        """GET 요청 처리"""
        path = urlparse(self.path).path
        
        if path == '/api/stats':
            response = self.greeum_bridge.get_stats()
            self._send_json_response(response)
        
        elif path == '/health':
            self._send_json_response({"status": "healthy", "service": "greeum-bridge"})
        
        else:
            self._send_json_response({"error": "Not found"}, 404)
    
    def log_message(self, format, *args):
        """로그 메시지 출력 제어"""
        logger.info(f"{self.address_string()} - {format % args}")

def start_greeum_server(port=8767):
    """Greeum API 서버 시작"""
    try:
        # Greeum 브릿지 초기화
        GreeumAPIHandler.greeum_bridge = GreeumBridge()
        
        # HTTP 서버 시작
        server = HTTPServer(('localhost', port), GreeumAPIHandler)
        logger.info(f"🚀 Greeum Bridge API 서버 시작: http://localhost:{port}")
        logger.info("사용 가능한 엔드포인트:")
        logger.info("  POST /api/memory/add - 메모리 추가")
        logger.info("  POST /api/memory/search - 메모리 검색")
        logger.info("  GET /api/stats - 시스템 통계")
        logger.info("  GET /health - 헬스 체크")
        
        server.serve_forever()
        
    except Exception as e:
        logger.error(f"서버 시작 실패: {e}")
        sys.exit(1)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Greeum Bridge API Server')
    parser.add_argument('--port', type=int, default=8767, help='서버 포트 (기본: 8767)')
    args = parser.parse_args()
    
    start_greeum_server(args.port)