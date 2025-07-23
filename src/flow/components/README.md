# ClaudeFlow UI Components

## Overview
This directory contains the UI components for the ClaudeFlow application, which provides a hierarchical visualization of AI session management.

## Components

### MainLayout
The main application layout using react-resizable-panels:
- **Left Panel** (30% default, resizable 20-50%): Session hierarchy tree
  - Manager section (top)
  - Supervisors section (middle)
  - Workers section (bottom)
- **Right Panel** (70% default): Session details and controls

### SessionCard
A reusable card component for displaying session information:
- **Props**:
  - `session: SessionData` - Session information
  - `onClick?: (session: SessionData) => void` - Click handler
- **Features**:
  - Visual type indicators (Manager: 👔, Supervisor: 👷, Worker: ⚙️)
  - Status indicators (idle, active, completed, error)
  - Progress bar
  - Color-coded based on session type
  - Responsive hover effects

## Session Data Structure
```typescript
interface SessionData {
  id: string;
  type: 'manager' | 'supervisor' | 'worker';
  status: 'idle' | 'active' | 'completed' | 'error';
  progress: number;
  name?: string;
}
```

## Styling
- Uses TailwindCSS for styling
- Supports dark mode (prefers-color-scheme)
- Custom scrollbar styling
- Responsive design with proper touch targets

## Usage
```typescript
import { MainLayout } from './flow/components';

function App() {
  return <MainLayout />;
}
```