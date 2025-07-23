# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClaudeFlow is a hierarchical Claude-Code workflow manager designed to automate and visualize complex task workflows using the Claude API. The project is currently in the planning phase with a design document (in Korean) outlining the intended architecture.

## Planned Architecture

Based on the design document, ClaudeFlow will implement a three-tier hierarchical structure:

1. **Manager Sessions**: Interface with users, parse project plans, and distribute work
2. **Supervisor Sessions**: Break down tasks into smaller functional units and manage dependencies
3. **Worker Sessions**: Execute actual code generation and validation tasks

## Technology Stack (Planned)

- **Runtime**: Tauri (Rust + Webview) for cross-platform desktop application
- **Frontend**: React + Vite + TailwindCSS + Zustand
- **Backend**: Rust-based Tauri commands for local file access and session management
- **API**: Anthropic Claude API for task execution

## Development Commands

Since this is a pre-implementation project, there are no build or test commands yet. When implementing:

### For Tauri Application Setup
```bash
# Install Tauri CLI
cargo install tauri-cli

# Initialize Tauri project
cargo tauri init

# Development mode
cargo tauri dev

# Build for production
cargo tauri build
```

### For React Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build frontend
npm run build

# Run tests (when implemented)
npm test
```

## Key Implementation Priorities

When implementing ClaudeFlow, focus on:

1. **Session Management**: Create the hierarchical session structure (Manager → Supervisor → Worker)
2. **RequestCall Schema**: Implement the structured task request format with all required fields
3. **Visual Tree Representation**: Build the UI to show workflow hierarchy and task status
4. **Token Usage Tracking**: Implement real-time API usage and cost monitoring
5. **Local Storage**: Set up file structure for sessions, outputs, and configuration

## File Structure (Planned)

```
/project-directory/
├── claudeflow.app              # Standalone executable
├── project-plan.md            # User-created project plan
├── /sessions/                 # Session-specific conversations and logs
├── /outputs/                  # Generated work artifacts
├── workflow.log               # Complete execution history
└── claude.config.json         # API keys and usage limits
```

## Important Considerations

1. **State Management**: Each session operates independently with its own context
2. **Error Handling**: Implement robust error recovery and session restart capabilities
3. **Token Optimization**: Use context caching where possible to reduce API costs
4. **Security**: Never commit API keys; use environment variables or secure config files
5. **Validation**: Each Worker session must validate its output before marking tasks complete

## Current Status

The project is in the design phase. The DESIGN-DOCUMENT.md.rtf contains detailed specifications in Korean. Before starting implementation, ensure you understand the hierarchical workflow model and the RequestCall document structure described in the design document.