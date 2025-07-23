import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Session,
  SessionStatus,
  SessionMessage,
  ManagerSession,
  SupervisorSession,
  WorkerSession,
  FlowMessage,
  ProjectOverview,
  WorkPlan,
} from '../types/flow.types';

interface SessionStore {
  // State
  sessions: Record<string, Session>;
  sessionMessages: SessionMessage[];
  activeSessionId: string | null;

  // Actions
  createManagerSession: (name: string, projectOverview: ProjectOverview) => string;
  createSupervisorSession: (parentId: string, name: string, component: string) => string;
  createWorkerSession: (parentId: string, name: string, taskId: string, description: string, requirements: string[]) => string;
  
  updateSessionStatus: (sessionId: string, status: SessionStatus, error?: string) => void;
  updateSessionProgress: (sessionId: string, progress: number) => void;
  
  addMessage: (sessionId: string, message: FlowMessage) => void;
  sendSessionMessage: (fromSessionId: string, toSessionId: string, type: SessionMessage['type'], payload: any) => void;
  
  assignSupervisorToManager: (managerId: string, supervisorId: string, component: string, description: string) => void;
  assignWorkerToSupervisor: (supervisorId: string, workerId: string, taskIds: string[]) => void;
  
  updateWorkPlan: (supervisorId: string, workPlan: WorkPlan) => void;
  updateTaskStatus: (supervisorId: string, taskId: string, status: WorkPlan['tasks'][0]['status']) => void;
  updateWorkerProgress: (workerId: string, stepName: string, status: 'pending' | 'in_progress' | 'completed' | 'failed') => void;
  completeWorkerTask: (workerId: string, success: boolean, output?: any, error?: string) => void;
  
  getSessionById: (id: string) => Session | undefined;
  getChildSessions: (parentId: string) => Session[];
  getSessionMessages: (sessionId: string) => SessionMessage[];
  
  setActiveSession: (sessionId: string | null) => void;
  clearAllSessions: () => void;
}

const generateId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useSessionStore = create<SessionStore>()(
  devtools(
    (set, get) => ({
      sessions: {},
      sessionMessages: [],
      activeSessionId: null,

      createManagerSession: (name, projectOverview) => {
        const id = generateId();
        const session: ManagerSession = {
          id,
          type: 'manager',
          name,
          status: 'idle',
          childIds: [],
          created: Date.now(),
          updated: Date.now(),
          messages: [],
          projectOverview,
          supervisorAssignments: [],
        };

        set((state) => ({
          sessions: { ...state.sessions, [id]: session },
        }));

        return id;
      },

      createSupervisorSession: (parentId, name, component) => {
        const id = generateId();
        const parentSession = get().sessions[parentId];
        
        if (!parentSession || parentSession.type !== 'manager') {
          throw new Error('Invalid parent session');
        }

        const session: SupervisorSession = {
          id,
          type: 'supervisor',
          name,
          status: 'idle',
          parentId,
          childIds: [],
          created: Date.now(),
          updated: Date.now(),
          messages: [],
          component,
          workPlan: {
            component,
            tasks: [],
          },
          workerAssignments: [],
        };

        set((state) => ({
          sessions: {
            ...state.sessions,
            [id]: session,
            [parentId]: {
              ...state.sessions[parentId],
              childIds: [...state.sessions[parentId].childIds, id],
              updated: Date.now(),
            },
          },
        }));

        return id;
      },

      createWorkerSession: (parentId, name, taskId, description, requirements) => {
        const id = generateId();
        const parentSession = get().sessions[parentId];
        
        if (!parentSession || parentSession.type !== 'supervisor') {
          throw new Error('Invalid parent session');
        }

        const session: WorkerSession = {
          id,
          type: 'worker',
          name,
          status: 'idle',
          parentId,
          childIds: [],
          created: Date.now(),
          updated: Date.now(),
          messages: [],
          requestCall: {
            taskId,
            description,
            requirements,
          },
          taskProgress: {
            started: Date.now(),
            steps: [],
          },
        };

        set((state) => ({
          sessions: {
            ...state.sessions,
            [id]: session,
            [parentId]: {
              ...state.sessions[parentId],
              childIds: [...state.sessions[parentId].childIds, id],
              updated: Date.now(),
            },
          },
        }));

        return id;
      },

      updateSessionStatus: (sessionId, status, error) => {
        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              status,
              error,
              updated: Date.now(),
            },
          },
        }));
      },

      updateSessionProgress: (sessionId, progress) => {
        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              progress,
              updated: Date.now(),
            },
          },
        }));
      },

      addMessage: (sessionId, message) => {
        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              messages: [...state.sessions[sessionId].messages, message],
              updated: Date.now(),
            },
          },
        }));
      },

      sendSessionMessage: (fromSessionId, toSessionId, type, payload) => {
        const message: SessionMessage = {
          id: generateId(),
          fromSessionId,
          toSessionId,
          type,
          payload,
          timestamp: Date.now(),
        };

        set((state) => ({
          sessionMessages: [...state.sessionMessages, message],
        }));

        // Simulate processing the message
        setTimeout(() => {
          const { updateSessionStatus } = get();
          if (type === 'task_assignment') {
            updateSessionStatus(toSessionId, 'active');
          }
        }, 100);
      },

      assignSupervisorToManager: (managerId, supervisorId, component, description) => {
        set((state) => {
          const managerSession = state.sessions[managerId] as ManagerSession;
          return {
            sessions: {
              ...state.sessions,
              [managerId]: {
                ...managerSession,
                supervisorAssignments: [
                  ...managerSession.supervisorAssignments,
                  { supervisorId, component, description },
                ],
                updated: Date.now(),
              },
            },
          };
        });
      },

      assignWorkerToSupervisor: (supervisorId, workerId, taskIds) => {
        set((state) => {
          const supervisorSession = state.sessions[supervisorId] as SupervisorSession;
          return {
            sessions: {
              ...state.sessions,
              [supervisorId]: {
                ...supervisorSession,
                workerAssignments: [
                  ...supervisorSession.workerAssignments,
                  { workerId, taskIds },
                ],
                updated: Date.now(),
              },
            },
          };
        });
      },

      updateWorkPlan: (supervisorId, workPlan) => {
        set((state) => ({
          sessions: {
            ...state.sessions,
            [supervisorId]: {
              ...state.sessions[supervisorId],
              workPlan,
              updated: Date.now(),
            },
          },
        }));
      },

      updateTaskStatus: (supervisorId, taskId, status) => {
        set((state) => {
          const session = state.sessions[supervisorId] as SupervisorSession;
          const updatedTasks = session.workPlan.tasks.map((task) =>
            task.id === taskId ? { ...task, status } : task
          );

          return {
            sessions: {
              ...state.sessions,
              [supervisorId]: {
                ...session,
                workPlan: {
                  ...session.workPlan,
                  tasks: updatedTasks,
                },
                updated: Date.now(),
              },
            },
          };
        });
      },

      updateWorkerProgress: (workerId, stepName, status) => {
        set((state) => {
          const session = state.sessions[workerId] as WorkerSession;
          const existingStepIndex = session.taskProgress.steps.findIndex(
            (step) => step.name === stepName
          );

          let updatedSteps;
          if (existingStepIndex >= 0) {
            updatedSteps = session.taskProgress.steps.map((step, index) =>
              index === existingStepIndex
                ? { ...step, status, timestamp: Date.now() }
                : step
            );
          } else {
            updatedSteps = [
              ...session.taskProgress.steps,
              { name: stepName, status, timestamp: Date.now() },
            ];
          }

          return {
            sessions: {
              ...state.sessions,
              [workerId]: {
                ...session,
                taskProgress: {
                  ...session.taskProgress,
                  steps: updatedSteps,
                },
                updated: Date.now(),
              },
            },
          };
        });
      },

      completeWorkerTask: (workerId, success, output, error) => {
        set((state) => {
          const session = state.sessions[workerId] as WorkerSession;
          return {
            sessions: {
              ...state.sessions,
              [workerId]: {
                ...session,
                status: success ? 'completed' : 'error',
                requestCall: {
                  ...session.requestCall,
                  result: { success, output, error },
                },
                taskProgress: {
                  ...session.taskProgress,
                  completed: Date.now(),
                },
                updated: Date.now(),
              },
            },
          };
        });
      },

      getSessionById: (id) => get().sessions[id],

      getChildSessions: (parentId) => {
        const { sessions } = get();
        return Object.values(sessions).filter(
          (session) => session.parentId === parentId
        );
      },

      getSessionMessages: (sessionId) => {
        const { sessionMessages } = get();
        return sessionMessages.filter(
          (msg) => msg.fromSessionId === sessionId || msg.toSessionId === sessionId
        );
      },

      setActiveSession: (sessionId) => {
        set({ activeSessionId: sessionId });
      },

      clearAllSessions: () => {
        set({ sessions: {}, sessionMessages: [], activeSessionId: null });
      },
    }),
    {
      name: 'session-store',
    }
  )
);