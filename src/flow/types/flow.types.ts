// Type definitions for .flow file format and communication system

export interface FlowMessage {
  id: string;
  timestamp: number;
  sender: 'human' | 'assistant';
  content: string;
  metadata?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
}

export interface FlowConversation {
  id: string;
  title: string;
  created: number;
  updated: number;
  messages: FlowMessage[];
  settings?: ConversationSettings;
}

export interface ConversationSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface FlowFile {
  version: string;
  conversation: FlowConversation;
  checksum?: string;
}

// Session Management Types
export type SessionType = 'manager' | 'supervisor' | 'worker';
export type SessionStatus = 'idle' | 'active' | 'completed' | 'error' | 'waiting';

export interface BaseSession {
  id: string;
  type: SessionType;
  name: string;
  status: SessionStatus;
  parentId?: string;
  childIds: string[];
  created: number;
  updated: number;
  messages: FlowMessage[];
  progress?: number;
  error?: string;
}

// Manager Session
export interface ProjectOverview {
  title: string;
  description: string;
  objectives: string[];
  constraints?: string[];
  deliverables: string[];
}

export interface ManagerSession extends BaseSession {
  type: 'manager';
  projectOverview: ProjectOverview;
  supervisorAssignments: {
    supervisorId: string;
    component: string;
    description: string;
  }[];
}

// Supervisor Session
export interface WorkPlan {
  component: string;
  tasks: {
    id: string;
    description: string;
    assignedWorkerId?: string;
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
    priority: 'low' | 'medium' | 'high';
    dependencies?: string[];
  }[];
  timeline?: {
    estimated: number;
    actual?: number;
  };
}

export interface SupervisorSession extends BaseSession {
  type: 'supervisor';
  workPlan: WorkPlan;
  component: string;
  workerAssignments: {
    workerId: string;
    taskIds: string[];
  }[];
}

// Worker Session
export interface RequestCall {
  taskId: string;
  description: string;
  requirements: string[];
  context?: Record<string, any>;
  result?: {
    success: boolean;
    output?: any;
    error?: string;
  };
}

export interface WorkerSession extends BaseSession {
  type: 'worker';
  requestCall: RequestCall;
  taskProgress: {
    started: number;
    completed?: number;
    steps: {
      name: string;
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      timestamp: number;
    }[];
  };
}

export type Session = ManagerSession | SupervisorSession | WorkerSession;

// Inter-session Communication
export interface SessionMessage {
  id: string;
  fromSessionId: string;
  toSessionId: string;
  type: 'task_assignment' | 'status_update' | 'result' | 'error' | 'query';
  payload: any;
  timestamp: number;
}