import { useState, useEffect, useRef } from 'react';
import { Session, ManagerSession, SessionStatus } from '../types/flow.types';
import { SessionExecutor, createSessionExecutor } from '../services/sessionExecutor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle2, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionControllerProps {
  projectDir: string;
  onSessionUpdate?: (session: Session) => void;
}

export function SessionController({ projectDir, onSessionUpdate }: SessionControllerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  const [executorStatus, setExecutorStatus] = useState<'idle' | 'running' | 'stopped'>('idle');
  const executorRef = useRef<SessionExecutor | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup executor on unmount
      if (executorRef.current) {
        executorRef.current.stop();
      }
    };
  }, []);

  const initializeExecutor = async () => {
    if (executorRef.current) return;

    const executor = createSessionExecutor({
      projectDir,
      maxConcurrentSessions: 3,
      messagePollingInterval: 1000
    });

    // Set up event listeners
    executor.on('executor:started', () => {
      setExecutorStatus('running');
    });

    executor.on('executor:stopped', () => {
      setExecutorStatus('stopped');
    });

    executor.on('session:created', (session: Session) => {
      setSessions(prev => [...prev, session]);
    });

    executor.on('session:updated', (session: Session) => {
      setSessions(prev => prev.map(s => s.id === session.id ? session : s));
      onSessionUpdate?.(session);
    });

    executor.on('session:activated', (session: Session) => {
      setActiveSessions(prev => [...prev, session.id]);
    });

    executor.on('session:completed', (session: Session) => {
      setActiveSessions(prev => prev.filter(id => id !== session.id));
    });

    executor.on('session:error', ({ session, error }: { session: Session; error: Error }) => {
      console.error(`Session ${session.id} error:`, error);
      setActiveSessions(prev => prev.filter(id => id !== session.id));
    });

    executorRef.current = executor;
    await executor.start();
  };

  const createTestWorkflow = async () => {
    if (!executorRef.current) {
      await initializeExecutor();
    }

    // Create a manager session for a test coding task
    const managerSession: ManagerSession = {
      id: `manager-${Date.now()}`,
      type: 'manager',
      name: 'Test Coding Project Manager',
      status: 'idle',
      childIds: [],
      created: Date.now(),
      updated: Date.now(),
      messages: [],
      projectOverview: {
        title: 'Simple Todo App Implementation',
        description: 'Create a basic todo application with add, complete, and delete functionality',
        objectives: [
          'Build a React component for the todo list',
          'Implement state management for todos',
          'Add basic styling with Tailwind CSS'
        ],
        deliverables: [
          'TodoList.tsx component',
          'TodoItem.tsx component',
          'Basic styling and layout'
        ]
      },
      supervisorAssignments: []
    };

    await executorRef.current!.createSession(managerSession);
  };

  const pauseSession = async (sessionId: string) => {
    if (executorRef.current) {
      await executorRef.current.pauseSession(sessionId);
    }
  };

  const resumeSession = async (sessionId: string) => {
    if (executorRef.current) {
      await executorRef.current.resumeSession(sessionId);
    }
  };

  const stopExecutor = async () => {
    if (executorRef.current) {
      await executorRef.current.stop();
      executorRef.current = null;
    }
  };

  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'manager':
        return 'bg-purple-50 border-purple-200';
      case 'supervisor':
        return 'bg-blue-50 border-blue-200';
      case 'worker':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Build session hierarchy
  const buildHierarchy = () => {
    const sessionMap = new Map(sessions.map(s => [s.id, s]));
    const rootSessions = sessions.filter(s => !s.parentId);
    
    const buildTree = (session: Session, level: number = 0): any => ({
      ...session,
      level,
      children: session.childIds
        .map(id => sessionMap.get(id))
        .filter(Boolean)
        .map(child => buildTree(child!, level + 1))
    });
    
    return rootSessions.map(s => buildTree(s));
  };

  const sessionHierarchy = buildHierarchy();

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Session Executor Control</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm px-2 py-1 rounded",
                executorStatus === 'running' ? 'bg-green-100 text-green-700' : 
                executorStatus === 'stopped' ? 'bg-red-100 text-red-700' : 
                'bg-gray-100 text-gray-700'
              )}>
                {executorStatus.toUpperCase()}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={createTestWorkflow}
              disabled={executorStatus === 'stopped'}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Create Test Workflow
            </Button>
            
            {executorStatus === 'running' ? (
              <Button
                onClick={stopExecutor}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Stop Executor
              </Button>
            ) : (
              <Button
                onClick={initializeExecutor}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Executor
              </Button>
            )}
          </div>
          
          {activeSessions.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Active Sessions: {activeSessions.length}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Hierarchy */}
      <div className="space-y-2">
        {sessionHierarchy.map((session: any) => (
          <SessionNode
            key={session.id}
            session={session}
            onPause={pauseSession}
            onResume={resumeSession}
            getStatusIcon={getStatusIcon}
            getSessionTypeColor={getSessionTypeColor}
            isActive={activeSessions.includes(session.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface SessionNodeProps {
  session: any;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  getStatusIcon: (status: SessionStatus) => JSX.Element;
  getSessionTypeColor: (type: string) => string;
  isActive: boolean;
}

function SessionNode({ 
  session, 
  onPause, 
  onResume, 
  getStatusIcon, 
  getSessionTypeColor,
  isActive 
}: SessionNodeProps) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="space-y-2">
      <Card 
        className={cn(
          "transition-all duration-200",
          getSessionTypeColor(session.type),
          isActive && "ring-2 ring-blue-400",
          `ml-${session.level * 8}`
        )}
      >
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(session.status)}
              <div>
                <h4 className="font-semibold text-sm">{session.name}</h4>
                <p className="text-xs text-gray-600">
                  {session.type} • {session.id.substring(0, 8)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {session.progress !== undefined && (
                <Progress value={session.progress} className="w-24 h-2" />
              )}
              
              {session.status === 'active' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onPause(session.id)}
                >
                  <Pause className="w-4 h-4" />
                </Button>
              ) : session.status === 'idle' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onResume(session.id)}
                >
                  <Play className="w-4 h-4" />
                </Button>
              ) : null}
              
              {session.children && session.children.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpanded(!expanded)}
                >
                  <RotateCcw className={cn(
                    "w-4 h-4 transition-transform",
                    !expanded && "-rotate-90"
                  )} />
                </Button>
              )}
            </div>
          </div>
          
          {session.error && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              Error: {session.error}
            </div>
          )}
        </CardHeader>
      </Card>
      
      {expanded && session.children && session.children.map((child: any) => (
        <SessionNode
          key={child.id}
          session={child}
          onPause={onPause}
          onResume={onResume}
          getStatusIcon={getStatusIcon}
          getSessionTypeColor={getSessionTypeColor}
          isActive={isActive}
        />
      ))}
    </div>
  );
}