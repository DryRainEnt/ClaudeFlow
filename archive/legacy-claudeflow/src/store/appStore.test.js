import { describe, it, expect, beforeEach } from 'vitest';
import useAppStore from './appStore';

describe('AppStore', () => {
  let store;

  beforeEach(() => {
    // 각 테스트 전에 스토어 초기화
    store = useAppStore.getState();
    store.resetApp();
  });

  it('should have initial state', () => {
    expect(store.isInitialized).toBe(false);
    expect(store.status).toBe('ready');
    expect(store.sessions).toEqual([]);
    expect(store.activeSessions).toBe(0);
  });

  it('should add session correctly', () => {
    const testSession = {
      id: 1,
      type: 'manager',
      status: 'active',
      name: 'Test Session'
    };

    store.addSession(testSession);
    
    const updatedStore = useAppStore.getState();
    expect(updatedStore.sessions).toHaveLength(1);
    expect(updatedStore.sessions[0]).toEqual(testSession);
    expect(updatedStore.activeSessions).toBe(1);
  });

  it('should remove session correctly', () => {
    const testSession = {
      id: 1,
      type: 'manager',
      status: 'active',
      name: 'Test Session'
    };

    // 세션 추가
    store.addSession(testSession);
    expect(useAppStore.getState().activeSessions).toBe(1);

    // 세션 제거
    store.removeSession(1);
    const updatedStore = useAppStore.getState();
    expect(updatedStore.sessions).toHaveLength(0);
    expect(updatedStore.activeSessions).toBe(0);
  });

  it('should update status correctly', () => {
    store.setStatus('initializing');
    expect(useAppStore.getState().status).toBe('initializing');

    store.setStatus('running');
    expect(useAppStore.getState().status).toBe('running');
  });

  it('should update workflow tree correctly', () => {
    const testTree = {
      manager: { id: 1, name: 'Manager' },
      supervisors: [{ id: 2, name: 'Supervisor' }],
      workers: [{ id: 3, name: 'Worker' }]
    };

    store.updateWorkflowTree(testTree);
    expect(useAppStore.getState().workflowTree).toEqual(testTree);
  });

  it('should reset app state correctly', () => {
    // 상태 변경
    store.setStatus('running');
    store.addSession({ id: 1, name: 'Test' });
    store.setInitialized(true);

    // 리셋
    store.resetApp();
    
    const resetStore = useAppStore.getState();
    expect(resetStore.isInitialized).toBe(false);
    expect(resetStore.status).toBe('ready');
    expect(resetStore.sessions).toEqual([]);
    expect(resetStore.activeSessions).toBe(0);
  });
});