import { create } from 'zustand';

// ClaudeFlow 앱의 전역 상태 관리
const useAppStore = create((set, get) => ({
  // 앱 상태
  isInitialized: false,
  status: 'ready', // 'ready', 'initializing', 'running', 'error'
  
  // 세션 관리
  sessions: [],
  activeSessions: 0,
  
  // 워크플로우 상태
  workflowTree: {
    manager: null,
    supervisors: [],
    workers: []
  },
  
  // 프로젝트 정보
  projectPath: '',
  projectFiles: [],
  
  // 상태 업데이트 액션들
  setStatus: (status) => set({ status }),
  
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  
  addSession: (session) => set((state) => ({
    sessions: [...state.sessions, session],
    activeSessions: state.activeSessions + 1
  })),
  
  removeSession: (sessionId) => set((state) => ({
    sessions: state.sessions.filter(s => s.id !== sessionId),
    activeSessions: Math.max(0, state.activeSessions - 1)
  })),
  
  updateWorkflowTree: (tree) => set({ workflowTree: tree }),
  
  setProjectPath: (path) => set({ projectPath: path }),
  
  setProjectFiles: (files) => set({ projectFiles: files }),
  
  // 초기화 액션
  initializeApp: async () => {
    set({ status: 'initializing' });
    
    try {
      // Tauri가 로드될 때까지 대기
      if (typeof window !== 'undefined' && window.__TAURI__) {
        // 현재 작업 디렉토리 가져오기
        const { invoke } = await import('@tauri-apps/api/core');
        const currentPath = await invoke('get_current_directory');
        set({ projectPath: currentPath });
        
        // 디렉토리 초기화
        const initResult = await invoke('initialize_directories');
        console.log('Directory initialization:', initResult);
      } else {
        // 웹 환경에서는 기본 경로 설정
        set({ projectPath: '/' });
      }
      
      // 초기화 완료
      set({ 
        isInitialized: true, 
        status: 'ready' 
      });
      
      return true;
    } catch (error) {
      console.error('App initialization failed:', error);
      set({ status: 'error' });
      return false;
    }
  },
  
  // 리셋 액션
  resetApp: () => set({
    isInitialized: false,
    status: 'ready',
    sessions: [],
    activeSessions: 0,
    workflowTree: {
      manager: null,
      supervisors: [],
      workers: []
    },
    projectPath: '',
    projectFiles: []
  })
}));

export default useAppStore;