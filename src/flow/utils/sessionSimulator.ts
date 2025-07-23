import { useSessionStore } from '../stores/sessionStore';

export const simulateSessionWorkflow = () => {
  const store = useSessionStore.getState();
  
  // Simulate Manager creating work plan
  const simulateManager = (managerId: string) => {
    store.updateSessionStatus(managerId, 'active');
    
    setTimeout(() => {
      // Create supervisors for different components
      const components = ['Frontend', 'Backend', 'Database'];
      
      components.forEach((component, index) => {
        setTimeout(() => {
          const supervisorId = store.createSupervisorSession(
            managerId,
            `${component} Supervisor`,
            component
          );
          
          store.assignSupervisorToManager(
            managerId,
            supervisorId,
            component,
            `Handle all ${component.toLowerCase()} related tasks`
          );
          
          store.sendSessionMessage(
            managerId,
            supervisorId,
            'task_assignment',
            {
              component,
              instructions: `Develop the ${component} components of the system`,
            }
          );
          
          // Start supervisor work
          setTimeout(() => simulateSupervisor(supervisorId), 1000);
        }, index * 2000);
      });
      
      store.updateSessionProgress(managerId, 30);
    }, 2000);
  };
  
  // Simulate Supervisor creating tasks
  const simulateSupervisor = (supervisorId: string) => {
    const store = useSessionStore.getState();
    const session = store.getSessionById(supervisorId);
    
    if (!session || session.type !== 'supervisor') return;
    
    store.updateSessionStatus(supervisorId, 'active');
    
    // Create work plan
    const tasks = [
      { id: `task_${Date.now()}_1`, description: `Implement ${session.component} architecture`, priority: 'high' as const },
      { id: `task_${Date.now()}_2`, description: `Create ${session.component} components`, priority: 'medium' as const },
      { id: `task_${Date.now()}_3`, description: `Test ${session.component} functionality`, priority: 'medium' as const },
    ];
    
    store.updateWorkPlan(supervisorId, {
      component: session.component,
      tasks: tasks.map(t => ({ ...t, status: 'pending' as const })),
    });
    
    // Create workers for each task
    tasks.forEach((task, index) => {
      setTimeout(() => {
        const workerId = store.createWorkerSession(
          supervisorId,
          `${session.component} Worker ${index + 1}`,
          task.id,
          task.description,
          [
            `Complete ${task.description}`,
            'Follow coding standards',
            'Write unit tests',
          ]
        );
        
        store.assignWorkerToSupervisor(supervisorId, workerId, [task.id]);
        store.updateTaskStatus(supervisorId, task.id, 'assigned');
        
        store.sendSessionMessage(
          supervisorId,
          workerId,
          'task_assignment',
          {
            task: task.description,
            deadline: new Date(Date.now() + 86400000).toISOString(),
          }
        );
        
        // Start worker
        setTimeout(() => simulateWorker(workerId, supervisorId, task.id), 1000);
      }, index * 3000);
    });
    
    store.updateSessionProgress(supervisorId, 20);
  };
  
  // Simulate Worker executing task
  const simulateWorker = (workerId: string, supervisorId: string, taskId: string) => {
    const store = useSessionStore.getState();
    store.updateSessionStatus(workerId, 'active');
    store.updateTaskStatus(supervisorId, taskId, 'in_progress');
    
    const steps = [
      'Analyzing requirements',
      'Setting up environment',
      'Implementing solution',
      'Writing tests',
      'Final review',
    ];
    
    steps.forEach((step, index) => {
      setTimeout(() => {
        store.updateWorkerProgress(workerId, step, 'in_progress');
        
        setTimeout(() => {
          store.updateWorkerProgress(workerId, step, 'completed');
          store.updateSessionProgress(workerId, (index + 1) * 20);
          
          if (index === steps.length - 1) {
            // Complete the task
            store.completeWorkerTask(workerId, true, {
              filesCreated: 5,
              testsWritten: 10,
              coverage: '95%',
            });
            
            store.updateTaskStatus(supervisorId, taskId, 'completed');
            
            store.sendSessionMessage(
              workerId,
              supervisorId,
              'result',
              {
                taskId,
                success: true,
                summary: 'Task completed successfully',
              }
            );
            
            // Update supervisor progress
            const supervisor = store.getSessionById(supervisorId);
            if (supervisor && supervisor.type === 'supervisor') {
              const completedTasks = supervisor.workPlan.tasks.filter(t => t.status === 'completed').length;
              const totalTasks = supervisor.workPlan.tasks.length;
              store.updateSessionProgress(supervisorId, Math.round((completedTasks / totalTasks) * 100));
              
              // Check if all tasks are done
              if (completedTasks === totalTasks) {
                store.updateSessionStatus(supervisorId, 'completed');
                
                // Update manager progress
                if (supervisor.parentId) {
                  const manager = store.getSessionById(supervisor.parentId);
                  if (manager && manager.type === 'manager') {
                    const completedSupervisors = store.getChildSessions(supervisor.parentId)
                      .filter(s => s.status === 'completed').length;
                    const totalSupervisors = manager.childIds.length;
                    store.updateSessionProgress(
                      supervisor.parentId,
                      Math.round((completedSupervisors / totalSupervisors) * 100)
                    );
                    
                    if (completedSupervisors === totalSupervisors) {
                      store.updateSessionStatus(supervisor.parentId, 'completed');
                    }
                  }
                }
              }
            }
          }
        }, 1000);
      }, index * 2000);
    });
  };
  
  return {
    simulateManager,
    simulateSupervisor,
    simulateWorker,
  };
};