import { Session, SessionMessage, SessionStatus, FlowMessage, WorkPlan, RequestCall } from '../types/flow.types';
import { claudeService } from './claudeService';
import { flowFileManager } from '../utils/flowFileManager';
import { EventEmitter } from 'events';

export interface ExecutionConfig {
  projectDir: string;
  maxConcurrentSessions?: number;
  messagePollingInterval?: number;
}

export class SessionExecutor extends EventEmitter {
  private sessions: Map<string, Session> = new Map();
  private activeSessions: Set<string> = new Set();
  private messageQueue: SessionMessage[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private config: ExecutionConfig;

  constructor(config: ExecutionConfig) {
    super();
    this.config = {
      maxConcurrentSessions: 5,
      messagePollingInterval: 1000,
      ...config
    };
  }

  // Start the executor
  async start(): Promise<void> {
    // Initialize .flow directory structure
    await flowFileManager.initializeFlowDirectory(this.config.projectDir);
    
    // Start message polling
    this.startMessagePolling();
    
    this.emit('executor:started');
  }

  // Stop the executor
  async stop(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    // Gracefully stop all active sessions
    for (const sessionId of this.activeSessions) {
      await this.pauseSession(sessionId);
    }
    
    this.emit('executor:stopped');
  }

  // Create and register a new session
  async createSession(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
    
    // Write initial session file
    await flowFileManager.writeSessionFile(this.config.projectDir, session);
    
    // Manager sessions activate immediately
    if (session.type === 'manager') {
      await this.activateSession(session.id);
    }
    
    this.emit('session:created', session);
  }

  // Activate a session based on its type and dependencies
  private async activateSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || this.activeSessions.has(sessionId)) return;
    
    // Check concurrent session limit
    if (this.activeSessions.size >= this.config.maxConcurrentSessions!) {
      this.emit('session:queued', sessionId);
      return;
    }
    
    // Check activation conditions
    const canActivate = this.checkActivationConditions(session);
    if (!canActivate) return;
    
    // Mark as active
    this.activeSessions.add(sessionId);
    session.status = 'active';
    await this.updateSession(session);
    
    this.emit('session:activated', session);
    
    // Start session execution
    this.executeSession(session).catch(error => {
      this.handleSessionError(session, error);
    });
  }

  // Check if a session meets activation conditions
  private checkActivationConditions(session: Session): boolean {
    switch (session.type) {
      case 'manager':
        // Managers activate immediately
        return true;
        
      case 'supervisor':
        // Supervisors activate when they have a WorkPlan
        return session.workPlan !== undefined;
        
      case 'worker':
        // Workers activate when they have a RequestCall
        return session.requestCall !== undefined;
        
      default:
        return false;
    }
  }

  // Execute a session
  private async executeSession(session: Session): Promise<void> {
    try {
      switch (session.type) {
        case 'manager':
          await this.executeManagerSession(session);
          break;
        case 'supervisor':
          await this.executeSupervisorSession(session);
          break;
        case 'worker':
          await this.executeWorkerSession(session);
          break;
      }
      
      // Mark session as completed
      session.status = 'completed';
      await this.updateSession(session);
      this.activeSessions.delete(session.id);
      
      this.emit('session:completed', session);
      
      // Check for queued sessions
      this.checkQueuedSessions();
      
    } catch (error) {
      throw error;
    }
  }

  // Execute Manager Session
  private async executeManagerSession(session: Session): Promise<void> {
    const messages: { role: 'user' | 'assistant', content: string }[] = [];
    
    // Build context from project overview
    if (session.type === 'manager' && session.projectOverview) {
      const context = `
Project: ${session.projectOverview.title}
Description: ${session.projectOverview.description}
Objectives: ${session.projectOverview.objectives.join(', ')}
Deliverables: ${session.projectOverview.deliverables.join(', ')}

Please analyze this project and create a work breakdown structure. Identify the main components and assign them to supervisors.
`;
      messages.push({ role: 'user', content: context });
    }
    
    // Get Claude's response
    const response = await claudeService.sendMessage(messages);
    
    // Add response to session messages
    const assistantMessage: FlowMessage = {
      id: this.generateId(),
      timestamp: Date.now(),
      sender: 'assistant',
      content: response
    };
    session.messages.push(assistantMessage);
    
    // Parse response and create supervisor sessions
    const supervisors = this.parseManagerResponse(response);
    for (const supervisor of supervisors) {
      await this.createSupervisorFromManager(session.id, supervisor);
    }
    
    await this.updateSession(session);
  }

  // Execute Supervisor Session
  private async executeSupervisorSession(session: Session): Promise<void> {
    if (session.type !== 'supervisor') return;
    
    const messages: { role: 'user' | 'assistant', content: string }[] = [];
    
    // Build context from work plan
    const context = `
Component: ${session.component}
Work Plan: ${JSON.stringify(session.workPlan, null, 2)}

Please analyze this work plan and create specific tasks for workers. Break down each task into actionable items.
`;
    messages.push({ role: 'user', content: context });
    
    // Get Claude's response
    const response = await claudeService.sendMessage(messages);
    
    // Add response to session messages
    const assistantMessage: FlowMessage = {
      id: this.generateId(),
      timestamp: Date.now(),
      sender: 'assistant',
      content: response
    };
    session.messages.push(assistantMessage);
    
    // Parse response and create worker sessions
    const workers = this.parseSupervisorResponse(response);
    for (const worker of workers) {
      await this.createWorkerFromSupervisor(session.id, worker);
    }
    
    await this.updateSession(session);
    
    // Monitor worker progress
    await this.monitorWorkerProgress(session);
  }

  // Execute Worker Session
  private async executeWorkerSession(session: Session): Promise<void> {
    if (session.type !== 'worker') return;
    
    const messages: { role: 'user' | 'assistant', content: string }[] = [];
    
    // Build context from request call
    const context = `
Task: ${session.requestCall.description}
Requirements: ${session.requestCall.requirements.join(', ')}
Context: ${JSON.stringify(session.requestCall.context || {}, null, 2)}

Please complete this task and provide the implementation.
`;
    messages.push({ role: 'user', content: context });
    
    // Update progress
    session.taskProgress = {
      started: Date.now(),
      steps: [
        { name: 'Analyzing task', status: 'completed', timestamp: Date.now() },
        { name: 'Implementing solution', status: 'in_progress', timestamp: Date.now() }
      ]
    };
    await this.updateSession(session);
    
    // Get Claude's response
    const response = await claudeService.sendMessage(messages);
    
    // Add response to session messages
    const assistantMessage: FlowMessage = {
      id: this.generateId(),
      timestamp: Date.now(),
      sender: 'assistant',
      content: response
    };
    session.messages.push(assistantMessage);
    
    // Update task progress
    session.taskProgress.steps.push({
      name: 'Implementing solution',
      status: 'completed',
      timestamp: Date.now()
    });
    session.taskProgress.completed = Date.now();
    
    // Set result
    session.requestCall.result = {
      success: true,
      output: response
    };
    
    await this.updateSession(session);
    
    // Notify parent supervisor
    await this.sendMessage({
      id: this.generateId(),
      fromSessionId: session.id,
      toSessionId: session.parentId!,
      type: 'result',
      payload: session.requestCall.result,
      timestamp: Date.now()
    });
  }

  // Send message between sessions
  async sendMessage(message: SessionMessage): Promise<void> {
    this.messageQueue.push(message);
    await flowFileManager.writeMessage(this.config.projectDir, message);
    this.emit('message:sent', message);
  }

  // Process incoming messages
  private async processMessages(): Promise<void> {
    const messages = await flowFileManager.readPendingMessages(this.config.projectDir);
    
    for (const message of messages) {
      const targetSession = this.sessions.get(message.toSessionId);
      if (!targetSession) continue;
      
      switch (message.type) {
        case 'task_assignment':
          if (targetSession.type === 'supervisor') {
            targetSession.workPlan = message.payload as WorkPlan;
            await this.updateSession(targetSession);
            await this.activateSession(targetSession.id);
          } else if (targetSession.type === 'worker') {
            targetSession.requestCall = message.payload as RequestCall;
            await this.updateSession(targetSession);
            await this.activateSession(targetSession.id);
          }
          break;
          
        case 'result':
          // Update parent session with child results
          if (targetSession.type === 'supervisor') {
            await this.handleWorkerResult(targetSession, message);
          } else if (targetSession.type === 'manager') {
            await this.handleSupervisorResult(targetSession, message);
          }
          break;
          
        case 'status_update':
          // Update session status
          await this.handleStatusUpdate(targetSession, message);
          break;
      }
      
      // Mark message as processed
      await flowFileManager.markMessageProcessed(this.config.projectDir, message.id);
    }
  }

  // Start polling for messages
  private startMessagePolling(): void {
    this.pollingInterval = setInterval(() => {
      this.processMessages().catch(error => {
        this.emit('error', error);
      });
    }, this.config.messagePollingInterval!);
  }

  // Update session state
  private async updateSession(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
    await flowFileManager.writeSessionFile(this.config.projectDir, session);
    this.emit('session:updated', session);
  }

  // Pause a session
  async pauseSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !this.activeSessions.has(sessionId)) return;
    
    this.activeSessions.delete(sessionId);
    session.status = 'idle';
    await this.updateSession(session);
    
    this.emit('session:paused', session);
  }

  // Resume a session
  async resumeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || this.activeSessions.has(sessionId)) return;
    
    await this.activateSession(sessionId);
  }

  // Handle session errors
  private async handleSessionError(session: Session, error: Error): Promise<void> {
    session.status = 'error';
    session.error = error.message;
    this.activeSessions.delete(session.id);
    
    await this.updateSession(session);
    this.emit('session:error', { session, error });
    
    // Notify parent if exists
    if (session.parentId) {
      await this.sendMessage({
        id: this.generateId(),
        fromSessionId: session.id,
        toSessionId: session.parentId,
        type: 'error',
        payload: { error: error.message },
        timestamp: Date.now()
      });
    }
  }

  // Helper methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private parseManagerResponse(response: string): any[] {
    // Simple parsing logic - in production, use more sophisticated parsing
    const supervisors = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('Supervisor:') || line.includes('Component:')) {
        supervisors.push({
          component: line.split(':')[1]?.trim() || 'Unknown Component',
          description: 'Parsed from manager response'
        });
      }
    }
    
    return supervisors;
  }

  private parseSupervisorResponse(response: string): any[] {
    // Simple parsing logic
    const workers = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('Task:') || line.includes('Worker:')) {
        workers.push({
          task: line.split(':')[1]?.trim() || 'Unknown Task',
          requirements: ['Parsed from supervisor response']
        });
      }
    }
    
    return workers;
  }

  private async createSupervisorFromManager(managerId: string, supervisorData: any): Promise<void> {
    const supervisor: Session = {
      id: this.generateId(),
      type: 'supervisor',
      name: `Supervisor - ${supervisorData.component}`,
      status: 'idle',
      parentId: managerId,
      childIds: [],
      created: Date.now(),
      updated: Date.now(),
      messages: [],
      component: supervisorData.component,
      workPlan: {
        component: supervisorData.component,
        tasks: []
      },
      workerAssignments: []
    };
    
    await this.createSession(supervisor);
    
    // Send work plan assignment
    await this.sendMessage({
      id: this.generateId(),
      fromSessionId: managerId,
      toSessionId: supervisor.id,
      type: 'task_assignment',
      payload: supervisor.workPlan,
      timestamp: Date.now()
    });
  }

  private async createWorkerFromSupervisor(supervisorId: string, workerData: any): Promise<void> {
    const worker: Session = {
      id: this.generateId(),
      type: 'worker',
      name: `Worker - ${workerData.task}`,
      status: 'idle',
      parentId: supervisorId,
      childIds: [],
      created: Date.now(),
      updated: Date.now(),
      messages: [],
      requestCall: {
        taskId: this.generateId(),
        description: workerData.task,
        requirements: workerData.requirements,
        context: {}
      },
      taskProgress: {
        started: 0,
        steps: []
      }
    };
    
    await this.createSession(worker);
    
    // Send request call assignment
    await this.sendMessage({
      id: this.generateId(),
      fromSessionId: supervisorId,
      toSessionId: worker.id,
      type: 'task_assignment',
      payload: worker.requestCall,
      timestamp: Date.now()
    });
  }

  private async monitorWorkerProgress(supervisor: Session): Promise<void> {
    // Monitor child worker sessions
    const checkProgress = async () => {
      let allCompleted = true;
      
      for (const childId of supervisor.childIds) {
        const child = this.sessions.get(childId);
        if (child && child.status !== 'completed') {
          allCompleted = false;
          break;
        }
      }
      
      if (allCompleted) {
        // All workers completed
        this.emit('supervisor:workers-completed', supervisor);
      } else {
        // Continue monitoring
        setTimeout(checkProgress, 2000);
      }
    };
    
    setTimeout(checkProgress, 2000);
  }

  private async handleWorkerResult(supervisor: Session, message: SessionMessage): Promise<void> {
    // Update supervisor with worker results
    this.emit('supervisor:worker-result', { supervisor, result: message.payload });
  }

  private async handleSupervisorResult(manager: Session, message: SessionMessage): Promise<void> {
    // Update manager with supervisor results
    this.emit('manager:supervisor-result', { manager, result: message.payload });
  }

  private async handleStatusUpdate(session: Session, message: SessionMessage): Promise<void> {
    // Handle status updates
    session.progress = message.payload.progress || session.progress;
    await this.updateSession(session);
  }

  private checkQueuedSessions(): void {
    // Check if any sessions can be activated now
    for (const [sessionId, session] of this.sessions) {
      if (session.status === 'idle' && !this.activeSessions.has(sessionId)) {
        this.activateSession(sessionId).catch(error => {
          this.emit('error', error);
        });
      }
    }
  }

  // Get session by ID
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  // Get all sessions
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  // Get active sessions
  getActiveSessions(): Session[] {
    return Array.from(this.activeSessions).map(id => this.sessions.get(id)!).filter(Boolean);
  }
}

export const createSessionExecutor = (config: ExecutionConfig) => new SessionExecutor(config);