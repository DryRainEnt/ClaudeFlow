import { createSessionExecutor } from '../services/sessionExecutor';
import { ManagerSession } from '../types/flow.types';

// Test script to demonstrate the workflow
export async function runTestWorkflow() {
  console.log('Starting ClaudeFlow test workflow...');
  
  // Create executor
  const executor = createSessionExecutor({
    projectDir: '/tmp/claudeflow-test',
    maxConcurrentSessions: 3,
    messagePollingInterval: 500
  });
  
  // Set up event listeners
  executor.on('executor:started', () => {
    console.log('✅ Executor started');
  });
  
  executor.on('session:created', (session) => {
    console.log(`📝 Session created: ${session.name} (${session.type})`);
  });
  
  executor.on('session:activated', (session) => {
    console.log(`🚀 Session activated: ${session.name}`);
  });
  
  executor.on('session:completed', (session) => {
    console.log(`✅ Session completed: ${session.name}`);
  });
  
  executor.on('session:error', ({ session, error }) => {
    console.error(`❌ Session error: ${session.name}`, error);
  });
  
  executor.on('message:sent', (message) => {
    console.log(`📨 Message sent: ${message.type} from ${message.fromSessionId.substring(0, 8)} to ${message.toSessionId.substring(0, 8)}`);
  });
  
  // Start executor
  await executor.start();
  
  // Create test manager session
  const managerSession: ManagerSession = {
    id: `manager-${Date.now()}`,
    type: 'manager',
    name: 'Todo App Project Manager',
    status: 'idle',
    childIds: [],
    created: Date.now(),
    updated: Date.now(),
    messages: [],
    projectOverview: {
      title: 'React Todo Application',
      description: 'Build a simple todo application with React and TypeScript',
      objectives: [
        'Create a responsive todo list interface',
        'Implement add, complete, and delete functionality',
        'Add local storage persistence',
        'Style with Tailwind CSS'
      ],
      deliverables: [
        'TodoApp.tsx - Main application component',
        'TodoList.tsx - List display component',
        'TodoItem.tsx - Individual todo item component',
        'useTodos.ts - Custom hook for todo state management',
        'types.ts - TypeScript interfaces'
      ]
    },
    supervisorAssignments: []
  };
  
  // Create the manager session
  await executor.createSession(managerSession);
  
  console.log('\n🎯 Test workflow initiated. Watch the sessions activate and communicate!');
  
  // Return executor for external control
  return executor;
}

// Export for use in browser environment
export default runTestWorkflow;