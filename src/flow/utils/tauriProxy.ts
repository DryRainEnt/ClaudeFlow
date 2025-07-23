// Tauri API proxy to handle both Tauri and browser environments

export const isTauri = () => {
  return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
};

// Dynamic imports for Tauri APIs
export const getTauriApi = async () => {
  if (!isTauri()) {
    throw new Error('Not running in Tauri environment');
  }
  return import(/* @vite-ignore */ '@tauri-apps/api/core');
};

export const getTauriFs = async () => {
  if (!isTauri()) {
    throw new Error('Not running in Tauri environment');
  }
  // @ts-ignore
  return import(/* @vite-ignore */ '@tauri-apps/api/fs');
};

export const getTauriPath = async () => {
  if (!isTauri()) {
    throw new Error('Not running in Tauri environment');
  }
  return import(/* @vite-ignore */ '@tauri-apps/api/path');
};

export const getTauriDialog = async () => {
  if (!isTauri()) {
    throw new Error('Not running in Tauri environment');
  }
  // @ts-ignore
  return import(/* @vite-ignore */ '@tauri-apps/api/dialog');
};

// Mock implementations for development
export const mockInvoke = async (cmd: string, args?: any): Promise<any> => {
  console.log(`Mock invoke: ${cmd}`, args);
  
  // Mock responses for common commands
  switch (cmd) {
    case 'has_api_key':
      return false;
    case 'get_api_key':
      throw new Error('No API key found');
    case 'save_api_key':
      console.log('Mock: API key saved');
      return null;
    case 'verify_api_key':
      return true;
    case 'validate_api_connection':
      return true;
    case 'create_new_conversation':
      return {
        id: 'mock-' + Date.now(),
        title: 'Mock Conversation',
        created: Date.now(),
        updated: Date.now(),
        messages: [],
        settings: null
      };
    case 'read_directory':
      return [];
    default:
      console.warn(`Mock: Unhandled command ${cmd}`);
      return null;
  }
};

export const mockFs = {
  exists: async (path: string) => {
    console.log(`Mock fs.exists: ${path}`);
    return false;
  },
  createDir: async (path: string) => {
    console.log(`Mock fs.createDir: ${path}`);
  },
  readTextFile: async (path: string) => {
    console.log(`Mock fs.readTextFile: ${path}`);
    return '{}';
  },
  writeTextFile: async (path: string, content: string) => {
    console.log(`Mock fs.writeTextFile: ${path}`, content);
  }
};

export const mockPath = {
  join: async (...parts: string[]) => {
    return parts.join('/');
  }
};

// Wrapper functions that work in both environments
export const invoke = async <T = any>(cmd: string, args?: any): Promise<T> => {
  try {
    if (isTauri()) {
      const { invoke } = await getTauriApi();
      const result = await invoke<T>(cmd, args);
      console.log(`[TauriProxy] Invoke success: ${cmd}`, result);
      return result;
    }
    return mockInvoke(cmd, args) as T;
  } catch (error) {
    console.error(`[TauriProxy] Invoke error: ${cmd}`, error);
    throw error;
  }
};

export const fs = {
  exists: async (path: string) => {
    if (isTauri()) {
      const { exists } = await getTauriFs();
      return exists(path);
    }
    return mockFs.exists(path);
  },
  createDir: async (path: string, options?: any) => {
    if (isTauri()) {
      const { createDir } = await getTauriFs();
      return createDir(path, options);
    }
    return mockFs.createDir(path);
  },
  readTextFile: async (path: string) => {
    if (isTauri()) {
      const { readTextFile } = await getTauriFs();
      return readTextFile(path);
    }
    return mockFs.readTextFile(path);
  },
  writeTextFile: async (path: string, content: string) => {
    if (isTauri()) {
      const { writeTextFile } = await getTauriFs();
      return writeTextFile(path, content);
    }
    return mockFs.writeTextFile(path, content);
  }
};

export const path = {
  join: async (...parts: string[]) => {
    if (isTauri()) {
      const { join } = await getTauriPath();
      return join(...parts);
    }
    return mockPath.join(...parts);
  }
};