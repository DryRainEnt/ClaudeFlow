import { invoke } from '@tauri-apps/api/core';
import { FlowFile, FlowConversation } from '../types/flow.types';

export class FlowService {
  static async loadFlowFile(path: string): Promise<FlowFile> {
    try {
      return await invoke<FlowFile>('load_flow_file', { path });
    } catch (error) {
      console.error('Failed to load flow file:', error);
      throw error;
    }
  }

  static async saveFlowFile(path: string, flowFile: FlowFile): Promise<void> {
    try {
      await invoke('save_flow_file', { path, flowFile });
    } catch (error) {
      console.error('Failed to save flow file:', error);
      throw error;
    }
  }

  static async createNewConversation(): Promise<FlowConversation> {
    try {
      return await invoke<FlowConversation>('create_new_conversation');
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      throw error;
    }
  }
}