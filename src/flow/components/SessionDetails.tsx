import React, { useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { simulateSessionWorkflow } from '../utils/sessionSimulator';

interface SessionDetailsProps {
  sessionId: string;
  onClose: () => void;
}

const SessionDetails: React.FC<SessionDetailsProps> = ({ sessionId, onClose }) => {
  const session = useSessionStore((state) => state.getSessionById(sessionId));
  const childSessions = useSessionStore((state) => state.getChildSessions(sessionId));
  const sessionMessages = useSessionStore((state) => state.getSessionMessages(sessionId));
  
  const createSupervisorSession = useSessionStore((state) => state.createSupervisorSession);
  const createWorkerSession = useSessionStore((state) => state.createWorkerSession);
  const sendSessionMessage = useSessionStore((state) => state.sendSessionMessage);
  
  const [showCreateChild, setShowCreateChild] = useState(false);
  const [childFormData, setChildFormData] = useState({
    name: '',
    component: '',
    taskDescription: '',
    requirements: [''],
  });

  if (!session) {
    return null;
  }

  const handleCreateChild = () => {
    if (session.type === 'manager') {
      const supervisorId = createSupervisorSession(
        session.id,
        childFormData.name,
        childFormData.component
      );
      
      // Send task assignment message
      sendSessionMessage(
        session.id,
        supervisorId,
        'task_assignment',
        {
          component: childFormData.component,
          description: `Handle ${childFormData.component} component of the project`,
        }
      );
    } else if (session.type === 'supervisor') {
      const workerId = createWorkerSession(
        session.id,
        childFormData.name,
        `task_${Date.now()}`,
        childFormData.taskDescription,
        childFormData.requirements.filter((r) => r.trim() !== '')
      );
      
      // Send task assignment message
      sendSessionMessage(
        session.id,
        workerId,
        'task_assignment',
        {
          task: childFormData.taskDescription,
          requirements: childFormData.requirements,
        }
      );
    }
    
    setShowCreateChild(false);
    setChildFormData({
      name: '',
      component: '',
      taskDescription: '',
      requirements: [''],
    });
  };

  const simulateProgress = () => {
    const { simulateManager, simulateSupervisor, simulateWorker } = simulateSessionWorkflow();
    
    if (session.type === 'manager') {
      simulateManager(session.id);
    } else if (session.type === 'supervisor') {
      simulateSupervisor(session.id);
    } else if (session.type === 'worker') {
      // For individual worker simulation, we need the supervisor and task info
      if (session.parentId && session.requestCall) {
        simulateWorker(session.id, session.parentId, session.requestCall.taskId);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {session.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
            <p className="font-semibold capitalize">{session.status}</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
            <p className="font-semibold">{session.progress || 0}%</p>
          </div>
        </div>

        {/* Type-specific content */}
        {session.type === 'manager' && session.projectOverview && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Project Overview</h3>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Title</p>
                <p>{session.projectOverview.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</p>
                <p>{session.projectOverview.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Objectives</p>
                <ul className="list-disc list-inside">
                  {session.projectOverview.objectives.map((obj, idx) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {session.type === 'supervisor' && session.workPlan && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Work Plan</h3>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4">
              <p className="font-medium mb-2">Component: {session.component}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tasks: {session.workPlan.tasks.length}
              </p>
            </div>
          </div>
        )}

        {session.type === 'worker' && session.requestCall && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Request Call</h3>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Task</p>
                <p>{session.requestCall.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Requirements</p>
                <ul className="list-disc list-inside">
                  {session.requestCall.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Child Sessions */}
        {childSessions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Child Sessions</h3>
            <div className="space-y-2">
              {childSessions.map((child) => (
                <div
                  key={child.id}
                  className="bg-gray-100 dark:bg-gray-700 rounded p-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{child.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {child.type} - {child.status}
                    </p>
                  </div>
                  <div className="text-sm">
                    Progress: {child.progress || 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {sessionMessages.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Messages</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {sessionMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-sm"
                >
                  <p className="font-medium">{msg.type}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {session.status === 'idle' && (
            <button
              onClick={simulateProgress}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {session.type === 'manager' ? 'Start Project' : 
               session.type === 'supervisor' ? 'Start Planning' : 
               'Start Task'}
            </button>
          )}
          
          {(session.type === 'manager' || session.type === 'supervisor') && (
            <button
              onClick={() => setShowCreateChild(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create {session.type === 'manager' ? 'Supervisor' : 'Worker'}
            </button>
          )}
        </div>

        {/* Create Child Modal */}
        {showCreateChild && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">
                Create {session.type === 'manager' ? 'Supervisor' : 'Worker'}
              </h3>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={childFormData.name}
                  onChange={(e) => setChildFormData({ ...childFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
                
                {session.type === 'manager' ? (
                  <input
                    type="text"
                    placeholder="Component"
                    value={childFormData.component}
                    onChange={(e) => setChildFormData({ ...childFormData, component: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  />
                ) : (
                  <>
                    <textarea
                      placeholder="Task Description"
                      value={childFormData.taskDescription}
                      onChange={(e) => setChildFormData({ ...childFormData, taskDescription: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                      rows={3}
                    />
                    <div>
                      <p className="text-sm mb-1">Requirements</p>
                      {childFormData.requirements.map((req, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder={`Requirement ${idx + 1}`}
                          value={req}
                          onChange={(e) => {
                            const newReqs = [...childFormData.requirements];
                            newReqs[idx] = e.target.value;
                            setChildFormData({ ...childFormData, requirements: newReqs });
                          }}
                          className="w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => setChildFormData({
                          ...childFormData,
                          requirements: [...childFormData.requirements, '']
                        })}
                        className="text-sm text-blue-600 dark:text-blue-400"
                      >
                        + Add Requirement
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCreateChild}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateChild(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-100 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetails;