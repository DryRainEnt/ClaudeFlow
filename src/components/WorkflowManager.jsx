import React, { useState } from 'react';
import SessionTerminal from './SessionTerminal';

const WorkflowManager = () => {
  const [sessions, setSessions] = useState([
    { id: 1, type: 'manager', name: 'Project Manager', status: 'active' }
  ]);

  const addSession = (type) => {
    const newSession = {
      id: sessions.length + 1,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${sessions.length + 1}`,
      status: 'active'
    };
    setSessions([...sessions, newSession]);
  };

  const removeSession = (id) => {
    setSessions(sessions.filter(session => session.id !== id));
  };

  const getSessionDescription = (type) => {
    switch (type) {
      case 'manager':
        return 'project-plan.md 분석 및 전체 워크플로우 관리';
      case 'supervisor':
        return '작업 분할 및 Worker 세션 관리';
      case 'worker':
        return '실제 코드 작성 및 작업 수행';
      default:
        return '일반 세션';
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🔄 ClaudeFlow 워크플로우 매니저
        </h2>
        <p className="text-gray-600">
          각 세션별로 독립적인 터미널 환경에서 Claude Code를 실행합니다
        </p>
      </div>

      {/* 세션 추가 버튼들 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-3">새 세션 추가</h3>
        <div className="flex gap-3">
          <button
            onClick={() => addSession('manager')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center gap-2"
          >
            👔 Manager 세션
          </button>
          <button
            onClick={() => addSession('supervisor')}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded flex items-center gap-2"
          >
            👷 Supervisor 세션
          </button>
          <button
            onClick={() => addSession('worker')}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded flex items-center gap-2"
          >
            🔧 Worker 세션
          </button>
        </div>
      </div>

      {/* 활성 세션들 */}
      <div className="space-y-6">
        {sessions.map((session) => (
          <div key={session.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {session.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {getSessionDescription(session.type)}
                </p>
              </div>
              <button
                onClick={() => removeSession(session.id)}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
              >
                🗑️ 제거
              </button>
            </div>
            
            <SessionTerminal 
              sessionId={session.id} 
              sessionType={session.type}
            />
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-4">활성 세션이 없습니다</p>
          <p>위의 버튼들을 사용해서 새 세션을 추가해보세요</p>
        </div>
      )}

      {/* 사용법 안내 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">💡 사용법</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 각 세션은 독립적인 터미널 환경을 가집니다</li>
          <li>• "시스템 터미널" 버튼으로 실제 터미널을 열 수 있습니다</li>
          <li>• 터미널에서 직접 `claude` 명령어를 사용할 수 있습니다</li>
          <li>• Manager → Supervisor → Worker 순서로 워크플로우를 진행하세요</li>
        </ul>
      </div>
    </div>
  );
};

export default WorkflowManager;