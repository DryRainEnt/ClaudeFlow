import { FlowFile, FlowConversation } from '../types/flow.types';

const FLOW_FILE_VERSION = '1.0.0';

export class FlowFileHandler {
  static serialize(conversation: FlowConversation): string {
    const flowFile: FlowFile = {
      version: FLOW_FILE_VERSION,
      conversation,
      checksum: this.generateChecksum(conversation)
    };
    return JSON.stringify(flowFile, null, 2);
  }

  static deserialize(content: string): FlowFile {
    try {
      const flowFile: FlowFile = JSON.parse(content);
      if (!this.validateFlowFile(flowFile)) {
        throw new Error('Invalid flow file format');
      }
      return flowFile;
    } catch (error) {
      throw new Error(`Failed to parse flow file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static validateFlowFile(flowFile: any): flowFile is FlowFile {
    return (
      flowFile &&
      typeof flowFile.version === 'string' &&
      flowFile.conversation &&
      typeof flowFile.conversation.id === 'string' &&
      typeof flowFile.conversation.title === 'string' &&
      Array.isArray(flowFile.conversation.messages)
    );
  }

  private static generateChecksum(conversation: FlowConversation): string {
    // Simple checksum for now - in production, use a proper hash
    const content = JSON.stringify(conversation);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}