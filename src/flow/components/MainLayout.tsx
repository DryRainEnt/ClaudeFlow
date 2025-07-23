import React, { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import SessionCard from './SessionCard';
import ProjectInitializer from './ProjectInitializer';
import SessionDetails from './SessionDetails';
import SettingsModal from './SettingsModal';
import ApiStatusIndicator from './ApiStatusIndicator';
import { WorkflowDemo } from './WorkflowDemo';
import { useSessionStore } from '../stores/sessionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { Session } from '../types/flow.types';
import { invoke } from '../utils/tauriProxy';
import { debugLog, checkEnvironment } from '../utils/debugHelper';

const MainLayout: React.FC = () => {
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const setActiveSession = useSessionStore((state) => state.setActiveSession);
  const clearAllSessions = useSessionStore((state) => state.clearAllSessions);
  
  const [showProjectInit, setShowProjectInit] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFirstRun, setShowFirstRun] = useState(false);
  const [showWorkflowDemo, setShowWorkflowDemo] = useState(false);
  
  const apiSettings = useSettingsStore((state) => state.apiSettings);
  
  // Debug: Log state changes
  useEffect(() => {
    console.log('[MainLayout] State changed:', {
      showProjectInit,
      showSettings,
      showFirstRun,
      showWorkflowDemo,
      selectedSessionId
    });
  }, [showProjectInit, showSettings, showFirstRun, showWorkflowDemo, selectedSessionId]);

  // Group sessions by type
  const sessionsByType = Object.values(sessions).reduce(
    (acc, session) => {
      acc[session.type].push(session);
      return acc;
    },
    { manager: [], supervisor: [], worker: [] } as Record<string, Session[]>
  );

  const handleSessionClick = (session: Session) => {
    console.log('[MainLayout] Session clicked:', session.id);
    setActiveSession(session.id);
    setSelectedSessionId(session.id);
  };

  // Check for API key on first run
  useEffect(() => {
    // Check environment on component mount
    checkEnvironment();
    
    const checkApiKey = async () => {
      try {
        debugLog('MainLayout', 'Checking API key...');
        const hasKey = await invoke<boolean>('has_api_key');
        debugLog('MainLayout', 'API key check result', hasKey);
        if (!hasKey) {
          setShowFirstRun(true);
        }
      } catch (error) {
        debugLog('MainLayout', 'Failed to check API key', error);
        console.error('Failed to check API key:', error);
        // Show settings on error
        setShowFirstRun(true);
      }
    };
    
    checkApiKey();
  }, []);

  // Auto-update sessions every second for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update status displays
      // In a real app, this would be triggered by actual session updates
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const renderSessionTree = () => {
    // Manager sessions (root level)
    const managerSessions = sessionsByType.manager;
    
    return (
      <div className="space-y-6">
        {managerSessions.map((manager) => (
          <div key={manager.id}>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
              Manager
            </h3>
            <SessionCard
              session={manager}
              onClick={handleSessionClick}
              childCount={manager.childIds.length}
              messageCount={useSessionStore.getState().getSessionMessages(manager.id).length}
            />
            
            {/* Supervisors under this manager */}
            {manager.childIds.length > 0 && (
              <div className="ml-6 mt-4 space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                  Supervisors
                </h4>
                {manager.childIds.map((supervisorId) => {
                  const supervisor = sessions[supervisorId];
                  if (!supervisor || supervisor.type !== 'supervisor') return null;
                  
                  return (
                    <div key={supervisor.id}>
                      <SessionCard
                        session={supervisor}
                        onClick={handleSessionClick}
                        childCount={supervisor.childIds.length}
                        messageCount={useSessionStore.getState().getSessionMessages(supervisor.id).length}
                      />
                      
                      {/* Workers under this supervisor */}
                      {supervisor.childIds.length > 0 && (
                        <div className="ml-6 mt-3 space-y-2">
                          <h5 className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                            Workers
                          </h5>
                          {supervisor.childIds.map((workerId) => {
                            const worker = sessions[workerId];
                            if (!worker || worker.type !== 'worker') return null;
                            
                            return (
                              <SessionCard
                                key={worker.id}
                                session={worker}
                                onClick={handleSessionClick}
                                messageCount={useSessionStore.getState().getSessionMessages(worker.id).length}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        
        {/* Orphaned supervisors (shouldn't happen in normal flow) */}
        {sessionsByType.supervisor.filter(s => !s.parentId).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
              Unassigned Supervisors
            </h3>
            <div className="space-y-3">
              {sessionsByType.supervisor
                .filter(s => !s.parentId)
                .map((supervisor) => (
                  <SessionCard
                    key={supervisor.id}
                    session={supervisor}
                    onClick={handleSessionClick}
                    childCount={supervisor.childIds.length}
                    messageCount={useSessionStore.getState().getSessionMessages(supervisor.id).length}
                  />
                ))}
            </div>
          </div>
        )}
        
        {/* Orphaned workers (shouldn't happen in normal flow) */}
        {sessionsByType.worker.filter(w => !w.parentId).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
              Unassigned Workers
            </h3>
            <div className="space-y-3">
              {sessionsByType.worker
                .filter(w => !w.parentId)
                .map((worker) => (
                  <SessionCard
                    key={worker.id}
                    session={worker}
                    onClick={handleSessionClick}
                    messageCount={useSessionStore.getState().getSessionMessages(worker.id).length}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Session Tree */}
        <Panel defaultSize={30} minSize={20} maxSize={50}>
          <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Session Hierarchy</h2>
                <ApiStatusIndicator onSettingsClick={() => setShowSettings(true)} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log('[MainLayout] New Project clicked, apiKey exists:', !!apiSettings.apiKey);
                    if (!apiSettings.apiKey) {
                      console.log('[MainLayout] No API key, showing settings');
                      setShowSettings(true);
                    } else {
                      setShowProjectInit(true);
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  title="New Project"
                >
                  + New Project
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    debugLog('MainLayout', 'Demo button clicked', { showWorkflowDemo });
                    console.log('[MainLayout] Demo button clicked!');
                    setShowWorkflowDemo(true);
                  }}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#9333ea',
                    color: 'white',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Workflow Demo"
                >
                  Demo
                </button>
                {Object.keys(sessions).length > 0 && (
                  <button
                    onClick={() => {
                      console.log('[MainLayout] Clear All clicked');
                      clearAllSessions();
                    }}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                    title="Clear All"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {Object.keys(sessions).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No active sessions
                  </p>
                  <button
                    onClick={() => setShowProjectInit(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={!apiSettings.apiKey}
                  >
                    Create New Project
                  </button>
                  {!apiSettings.apiKey && (
                    <p className="text-sm text-gray-400 mt-2">
                      API key required. Click settings to configure.
                    </p>
                  )}
                </div>
              ) : (
                renderSessionTree()
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" />

        {/* Right Panel - Session Details */}
        <Panel defaultSize={70}>
          <div className="h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
            {activeSessionId && sessions[activeSessionId] ? (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-4xl">
                      {sessions[activeSessionId].type === 'manager' ? '👔' : 
                       sessions[activeSessionId].type === 'supervisor' ? '👷' : '⚙️'}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {sessions[activeSessionId].name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 capitalize">
                        {sessions[activeSessionId].type} Session
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedSessionId(activeSessionId)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      View Details
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Session ID
                      </label>
                      <p className="text-gray-800 dark:text-gray-200 font-mono text-sm">
                        {sessions[activeSessionId].id}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Status
                      </label>
                      <p className="text-gray-800 dark:text-gray-200 capitalize">
                        {sessions[activeSessionId].status}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Progress
                    </label>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Task Progress</span>
                        <span>{sessions[activeSessionId].progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${sessions[activeSessionId].progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Session Information
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Created</span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {new Date(sessions[activeSessionId].created).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {new Date(sessions[activeSessionId].updated).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Messages</span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {sessions[activeSessionId].messages.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Child Sessions</span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {sessions[activeSessionId].childIds.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl text-gray-500 dark:text-gray-400 mb-2">
                    No session selected
                  </p>
                  <p className="text-gray-400 dark:text-gray-500">
                    Click on a session card to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>

      {/* Modals */}
      {showProjectInit && (
        <ProjectInitializer onClose={() => setShowProjectInit(false)} />
      )}
      
      {selectedSessionId && (
        <SessionDetails
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings || showFirstRun}
        onClose={() => {
          setShowSettings(false);
          setShowFirstRun(false);
        }}
        isFirstRun={showFirstRun}
      />
      
      {/* Workflow Demo Modal */}
      {showWorkflowDemo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">Workflow Demo</h2>
              <button
                onClick={() => setShowWorkflowDemo(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <WorkflowDemo />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;