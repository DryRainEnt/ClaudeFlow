import { Session, SessionMessage, FlowFile, FlowConversation } from '../types/flow.types';
// @ts-ignore - Tauri API types are not available in test environment
import { invoke } from '@tauri-apps/api/core';
// @ts-ignore - Tauri API types are not available in test environment
import { join } from '@tauri-apps/api/path';
// @ts-ignore - Tauri API types are not available in test environment
import { exists, createDir, readTextFile, writeTextFile } from '@tauri-apps/api/fs';

export interface FlowDirectory {
  root: string;
  sessions: string;
  messages: string;
  history: string;
  artifacts: string;
}

class FlowFileManager {
  // Initialize .flow directory structure
  async initializeFlowDirectory(projectDir: string): Promise<FlowDirectory> {
    const flowDir = await join(projectDir, '.flow');
    const dirs: FlowDirectory = {
      root: flowDir,
      sessions: await join(flowDir, 'sessions'),
      messages: await join(flowDir, 'messages'),
      history: await join(flowDir, 'history'),
      artifacts: await join(flowDir, 'artifacts')
    };

    // Create directories if they don't exist
    for (const dir of Object.values(dirs)) {
      if (!(await exists(dir))) {
        await createDir(dir, { recursive: true });
      }
    }

    // Create metadata file
    const metadataPath = await join(flowDir, 'metadata.json');
    if (!(await exists(metadataPath))) {
      const metadata = {
        version: '1.0.0',
        created: new Date().toISOString(),
        projectDir: projectDir
      };
      await writeTextFile(metadataPath, JSON.stringify(metadata, null, 2));
    }

    return dirs;
  }

  // Write session file
  async writeSessionFile(projectDir: string, session: Session): Promise<void> {
    const dirs = await this.initializeFlowDirectory(projectDir);
    const sessionPath = await join(dirs.sessions, `${session.id}.json`);
    
    const sessionData = {
      ...session,
      lastUpdated: new Date().toISOString()
    };
    
    await writeTextFile(sessionPath, JSON.stringify(sessionData, null, 2));
    
    // Also write to history for tracking
    const historyPath = await join(dirs.history, `${session.id}-${Date.now()}.json`);
    await writeTextFile(historyPath, JSON.stringify(sessionData, null, 2));
  }

  // Read session file
  async readSessionFile(projectDir: string, sessionId: string): Promise<Session | null> {
    const dirs = await this.initializeFlowDirectory(projectDir);
    const sessionPath = await join(dirs.sessions, `${sessionId}.json`);
    
    if (!(await exists(sessionPath))) {
      return null;
    }
    
    const content = await readTextFile(sessionPath);
    return JSON.parse(content) as Session;
  }

  // Write message to queue
  async writeMessage(projectDir: string, message: SessionMessage): Promise<void> {
    const dirs = await this.initializeFlowDirectory(projectDir);
    const messagePath = await join(dirs.messages, `${message.id}.json`);
    
    const messageData = {
      ...message,
      status: 'pending',
      created: new Date().toISOString()
    };
    
    await writeTextFile(messagePath, JSON.stringify(messageData, null, 2));
  }

  // Read pending messages
  async readPendingMessages(projectDir: string): Promise<SessionMessage[]> {
    const dirs = await this.initializeFlowDirectory(projectDir);
    const messages: SessionMessage[] = [];
    
    try {
      // Use Tauri command to read directory
      const files = await invoke<string[]>('read_directory', { path: dirs.messages });
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = await join(dirs.messages, file);
          const content = await readTextFile(filePath);
          const messageData = JSON.parse(content);
          
          if (messageData.status === 'pending') {
            messages.push(messageData as SessionMessage);
          }
        }
      }
    } catch (error) {
      console.error('Error reading messages:', error);
    }
    
    return messages;
  }

  // Mark message as processed
  async markMessageProcessed(projectDir: string, messageId: string): Promise<void> {
    const dirs = await this.initializeFlowDirectory(projectDir);
    const messagePath = await join(dirs.messages, `${messageId}.json`);
    
    if (await exists(messagePath)) {
      const content = await readTextFile(messagePath);
      const messageData = JSON.parse(content);
      messageData.status = 'processed';
      messageData.processedAt = new Date().toISOString();
      
      await writeTextFile(messagePath, JSON.stringify(messageData, null, 2));
    }
  }

  // Write conversation history
  async writeConversationHistory(projectDir: string, sessionId: string, conversation: FlowConversation): Promise<void> {
    const dirs = await this.initializeFlowDirectory(projectDir);
    const conversationPath = await join(dirs.history, `conversation-${sessionId}.flow`);
    
    const flowFile: FlowFile = {
      version: '1.0.0',
      conversation: conversation,
      checksum: await this.calculateChecksum(conversation)
    };
    
    await writeTextFile(conversationPath, JSON.stringify(flowFile, null, 2));
  }

  // Save artifact (code, documents, etc.)
  async saveArtifact(projectDir: string, sessionId: string, artifactName: string, content: string): Promise<string> {
    const dirs = await this.initializeFlowDirectory(projectDir);
    const sessionArtifactDir = await join(dirs.artifacts, sessionId);
    
    if (!(await exists(sessionArtifactDir))) {
      await createDir(sessionArtifactDir, { recursive: true });
    }
    
    const artifactPath = await join(sessionArtifactDir, artifactName);
    await writeTextFile(artifactPath, content);
    
    return artifactPath;
  }

  // Get all sessions
  async getAllSessions(projectDir: string): Promise<Session[]> {
    const dirs = await this.initializeFlowDirectory(projectDir);
    const sessions: Session[] = [];
    
    try {
      const files = await invoke<string[]>('read_directory', { path: dirs.sessions });
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = await join(dirs.sessions, file);
          const content = await readTextFile(filePath);
          sessions.push(JSON.parse(content) as Session);
        }
      }
    } catch (error) {
      console.error('Error reading sessions:', error);
    }
    
    return sessions;
  }

  // Get session hierarchy
  async getSessionHierarchy(projectDir: string, rootSessionId: string): Promise<any> {
    const allSessions = await this.getAllSessions(projectDir);
    const sessionMap = new Map(allSessions.map(s => [s.id, s]));
    
    const buildHierarchy = (sessionId: string): any => {
      const session = sessionMap.get(sessionId);
      if (!session) return null;
      
      return {
        ...session,
        children: session.childIds.map(childId => buildHierarchy(childId)).filter(Boolean)
      };
    };
    
    return buildHierarchy(rootSessionId);
  }

  // Clean up old messages
  async cleanupOldMessages(projectDir: string, daysToKeep: number = 7): Promise<void> {
    const dirs = await this.initializeFlowDirectory(projectDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    try {
      const files = await invoke<string[]>('read_directory', { path: dirs.messages });
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = await join(dirs.messages, file);
          const content = await readTextFile(filePath);
          const messageData = JSON.parse(content);
          
          if (messageData.status === 'processed' && new Date(messageData.created) < cutoffDate) {
            await invoke('remove_file', { path: filePath });
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up messages:', error);
    }
  }

  // Calculate checksum for flow file
  private async calculateChecksum(data: any): Promise<string> {
    const content = JSON.stringify(data);
    // Simple checksum - in production use proper hashing
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Export session data
  async exportSessionData(projectDir: string, sessionId: string, exportPath: string): Promise<void> {
    const session = await this.readSessionFile(projectDir, sessionId);
    if (!session) throw new Error('Session not found');
    
    const hierarchy = await this.getSessionHierarchy(projectDir, sessionId);
    
    const exportData = {
      session: hierarchy,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    await writeTextFile(exportPath, JSON.stringify(exportData, null, 2));
  }

  // Import session data
  async importSessionData(projectDir: string, importPath: string): Promise<Session> {
    const content = await readTextFile(importPath);
    const importData = JSON.parse(content);
    
    if (!importData.session) {
      throw new Error('Invalid import file format');
    }
    
    // Recursively import sessions
    const importSession = async (sessionData: any): Promise<Session> => {
      const session = {
        ...sessionData,
        children: undefined // Remove children from session object
      };
      
      await this.writeSessionFile(projectDir, session);
      
      // Import children
      if (sessionData.children && sessionData.children.length > 0) {
        for (const child of sessionData.children) {
          await importSession(child);
        }
      }
      
      return session;
    };
    
    return await importSession(importData.session);
  }
}

export const flowFileManager = new FlowFileManager();