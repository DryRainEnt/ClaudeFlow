import { useState } from 'react';
import { SessionController } from './SessionController';
import { Session, FlowMessage } from '../types/flow.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageSquare, Activity } from 'lucide-react';

export function WorkflowDemo() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [projectDir] = useState('/tmp/claudeflow-demo'); // Demo directory

  const handleSessionUpdate = (session: Session) => {
    if (selectedSession?.id === session.id) {
      setSelectedSession(session);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderMessage = (message: FlowMessage) => {
    const isAssistant = message.sender === 'assistant';
    
    return (
      <div
        key={message.id}
        className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-4`}
      >
        <div
          className={`max-w-[70%] rounded-lg p-3 ${
            isAssistant
              ? 'bg-gray-100 text-gray-800'
              : 'bg-blue-500 text-white'
          }`}
        >
          <div className="text-xs opacity-70 mb-1">
            {formatTimestamp(message.timestamp)}
          </div>
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
          {message.metadata && (
            <div className="mt-2 text-xs opacity-70">
              Model: {message.metadata.model}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSessionDetails = () => {
    if (!selectedSession) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select a session to view details
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{selectedSession.name}</h3>
          <Badge variant={selectedSession.status === 'active' ? 'default' : 'secondary'}>
            {selectedSession.status}
          </Badge>
        </div>

        <Tabs defaultValue="messages" className="w-full">
          <TabsList>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-4">
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              {selectedSession.messages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet</div>
              ) : (
                selectedSession.messages.map(renderMessage)
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <div className="space-y-3">
              <div>
                <span className="font-semibold">Type:</span> {selectedSession.type}
              </div>
              <div>
                <span className="font-semibold">ID:</span> {selectedSession.id}
              </div>
              <div>
                <span className="font-semibold">Created:</span>{' '}
                {new Date(selectedSession.created).toLocaleString()}
              </div>
              
              {selectedSession.type === 'manager' && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Project Overview:</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <div><strong>Title:</strong> {selectedSession.projectOverview.title}</div>
                    <div className="mt-2">
                      <strong>Description:</strong> {selectedSession.projectOverview.description}
                    </div>
                    <div className="mt-2">
                      <strong>Objectives:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {selectedSession.projectOverview.objectives.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedSession.type === 'supervisor' && selectedSession.workPlan && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Work Plan:</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <div><strong>Component:</strong> {selectedSession.component}</div>
                    <div className="mt-2">
                      <strong>Tasks:</strong> {selectedSession.workPlan.tasks.length}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedSession.type === 'worker' && selectedSession.requestCall && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Request Call:</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <div><strong>Task:</strong> {selectedSession.requestCall.description}</div>
                    <div className="mt-2">
                      <strong>Requirements:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {selectedSession.requestCall.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                    {selectedSession.requestCall.result && (
                      <div className="mt-2">
                        <strong>Result:</strong>{' '}
                        <Badge variant={selectedSession.requestCall.result.success ? 'default' : 'destructive'}>
                          {selectedSession.requestCall.result.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <div className="space-y-2">
              {selectedSession.type === 'worker' && selectedSession.taskProgress && (
                <div>
                  <h4 className="font-semibold mb-2">Task Progress:</h4>
                  <div className="space-y-1">
                    {selectedSession.taskProgress.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge
                          variant={
                            step.status === 'completed' ? 'default' :
                            step.status === 'in_progress' ? 'secondary' :
                            'outline'
                          }
                        >
                          {step.status}
                        </Badge>
                        <span>{step.name}</span>
                        <span className="text-gray-500 text-xs">
                          {formatTimestamp(step.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedSession.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                  <strong>Error:</strong> {selectedSession.error}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">ClaudeFlow Workflow Demo</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Session Controller */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionController
                projectDir={projectDir}
                onSessionUpdate={handleSessionUpdate}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Session Details */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSessionDetails()}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Start Executor" to initialize the session execution system</li>
            <li>Click "Create Test Workflow" to start a demo coding task</li>
            <li>Watch as the Manager creates Supervisors, and Supervisors create Workers</li>
            <li>Sessions activate automatically based on their dependencies</li>
            <li>Click on any session in the hierarchy to view its details</li>
            <li>Use pause/resume buttons to control individual sessions</li>
            <li>Messages are passed through the file system in the .flow directory</li>
          </ol>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Note:</h4>
            <p className="text-sm text-blue-800">
              This demo shows how ClaudeFlow manages session lifecycles and communication.
              The actual Claude API integration will process real coding tasks through the
              hierarchical session structure.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}