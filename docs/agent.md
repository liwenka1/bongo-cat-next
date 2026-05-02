# BongoCat - Architecture Documentation

## Overview

BongoCat is a desktop pet application with AI agent capabilities, built using a modern monorepo architecture. The system consists of three main components:

1. **Desktop App** - Tauri-based desktop application with Next.js frontend
2. **Agent Service** - Node.js HTTP service for AI orchestration and task management
3. **Shared Packages** - Common types, configurations, and prompts

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Desktop App (Tauri + Next.js)                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │  │
│  │  │ Pet Window │  │  Settings  │  │  Manager Window  │   │  │
│  │  │ (Live2D)   │  │   Window   │  │  (Chat/Tasks)    │   │  │
│  │  └────────────┘  └────────────┘  └──────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ IPC / HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Rust Backend (Tauri)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   Commands   │  │    Storage   │  │   System Integration │ │
│  │  - Bridge    │  │  - Settings  │  │   - Tray Menu        │ │
│  │  - Hotkeys   │  │  - Perms     │  │   - Global Hotkeys   │ │
│  │  - Pet App   │  │  - Memory    │  │   - Window Manager   │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (localhost:4343)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Agent Service (Node.js)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Layer                             │  │
│  │  /api/health  /api/chat  /api/tasks  /api/settings      │  │
│  │  /api/memory  /api/audit                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Orchestrator │  │    Guards    │  │      Providers       │ │
│  │  - Planner   │  │  - Policy    │  │   - OpenAI (future)  │ │
│  │  - Router    │  │  - Risk      │  │   - Codex (future)   │ │
│  │  - Executor  │  │  - Confirm   │  │   - Memory           │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Tool Registry                         │  │
│  │  open_app | open_url | run_command | file_search        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ File System
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Directory                             │
│  ~/AppData/Roaming/BongoCat/ (Windows)                  │
│  ~/Library/Application Support/BongoCat/ (macOS)        │
│  ~/.config/BongoCat/ (Linux)                            │
│                                                                 │
│  ├── data/                                                      │
│  │   ├── settings.json      - Application settings             │
│  │   ├── permissions.json   - Security permissions             │
│  │   ├── memories.json      - User memory profile              │
│  │   └── tasks.json         - Task queue                       │
│  └── logs/                                                      │
│      ├── desktop.jsonl       - Desktop app audit log           │
│      └── agent-service.jsonl - Agent service audit log         │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Desktop App (`apps/desktop`)

**Technology Stack:**
- **Framework**: Next.js 15 (React 19)
- **Runtime**: Tauri 2 (Rust backend)
- **UI**: TailwindCSS 4, Base UI components
- **Animation**: Live2D (pixi-live2d-display)
- **State**: Zustand
- **i18n**: i18next

**Key Features:**
- Live2D pet display with keyboard/mouse interaction
- Multi-window architecture (Pet, Settings, Manager)
- System tray integration
- Global hotkey support
- Transparent, click-through window modes

**Directory Structure:**
```
apps/desktop/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── pet/               # Pet window page
│   │   ├── settings/          # Settings window page
│   │   └── page.tsx           # Manager window (main)
│   ├── components/            # Reusable UI components
│   │   ├── cat-viewer.tsx     # Live2D renderer
│   │   ├── motion-selector.tsx
│   │   └── expression-selector.tsx
│   ├── features/              # Feature modules
│   │   ├── chat/              # Chat interface
│   │   ├── tasks/             # Task management
│   │   ├── settings/          # Settings forms
│   │   └── permissions/       # Permission dialogs
│   ├── hooks/                 # React hooks
│   │   ├── live2d/            # Live2D system hooks
│   │   ├── menu/              # Context menu hooks
│   │   └── use-keyboard.ts    # Keyboard event hook
│   └── lib/                   # Utilities
└── src-tauri/                 # Rust backend
    ├── src/
    │   ├── commands/          # Tauri commands (IPC)
    │   │   ├── bridge.rs      # Tool execution bridge
    │   │   ├── hotkey.rs      # Global hotkey management
    │   │   ├── pet_app.rs     # Pet process management
    │   │   ├── settings.rs    # Settings persistence
    │   │   └── window.rs      # Window management
    │   ├── core/              # Core functionality
    │   │   ├── device.rs      # Device info
    │   │   └── setup/         # App initialization
    │   ├── storage.rs         # File system operations
    │   └── types.rs           # Rust type definitions
    └── Cargo.toml
```

### 2. Agent Service (`apps/agent-service`)

**Technology Stack:**
- **Runtime**: Node.js (ESM)
- **Server**: Native `node:http`
- **Language**: TypeScript

**Responsibilities:**
- Chat message orchestration
- Task planning and execution
- Permission validation
- Risk assessment
- Audit logging

**Architecture Layers:**

#### API Layer (`src/api/`)
RESTful HTTP endpoints:
- `GET /api/health` - Service health check
- `POST /api/chat` - Process chat messages
- `GET /api/tasks` - List tasks
- `POST /api/tasks/:id/events` - Update task status
- `GET /api/settings` - Get settings bundle
- `PUT /api/settings` - Update settings
- `GET /api/memory` - Get memory profile
- `PUT /api/memory` - Update memory profile
- `GET /api/audit` - Get audit logs

#### Orchestrator Layer (`src/orchestrator/`)
- **Router** (`router.ts`): Analyzes user messages and determines intent
  - URL detection → `open_url`
  - App name matching → `open_app`
  - Command matching → `run_command`
  - Keyword search → `file_search`
  - Fallback → `chat`

- **Planner** (`planner.ts`): Creates execution plans
  - Builds `PlannedToolCall` objects
  - Applies permission policies
  - Determines risk levels
  - Decides if confirmation is needed

- **Executor** (`executor.ts`): Manages task queue
  - Creates `AgentTask` records
  - Persists to `tasks.json`
  - Tracks task lifecycle

#### Guard Layer (`src/guard/`)
Security and safety checks:
- **Policy** (`policy.ts`): Validates against permission whitelist
- **Risk** (`risk.ts`): Assesses operation risk level
- **Confirm** (`confirm.ts`): Determines if user confirmation is required

#### Tool Layer (`src/tools/`)
Tool implementations:
- `open_app.ts` - Launch applications
- `open_url.ts` - Open URLs in browser
- `run_command.ts` - Execute whitelisted commands
- `file_ops.ts` - File search operations

#### Provider Layer (`src/providers/`)
External service integrations (future):
- `openai.ts` - OpenAI API integration (planned)
- `codex.ts` - Code-specific model (planned)
- `memory.ts` - Memory profile management

### 3. Shared Packages (`packages/`)

#### `@my-pet/shared-types`
TypeScript type definitions shared across all apps:
- `ChatMessage`, `ChatRequest`, `ChatResponse`
- `AgentTask`, `TaskStatus`
- `PlannedToolCall`, `ToolPayload`
- `AppSettings`, `PermissionSettings`
- `MemoryProfile`
- `ServiceHealth`

#### `@my-pet/shared-config`
Configuration constants and defaults:
- `AGENT_SERVICE_PORT = 4343`
- `ALLOWED_APPS` - Whitelisted applications
- `ALLOWED_COMMANDS` - Whitelisted commands
- `DEFAULT_SETTINGS` - Default app settings
- `DEFAULT_PERMISSIONS` - Default security permissions
- `DEFAULT_MEMORY` - Default memory profile

#### `@my-pet/shared-prompts`
AI system prompts (future use):
- `DESKTOP_ASSISTANT_SYSTEM_PROMPT`
- `DESKTOP_ASSISTANT_PLANNER_PROMPT`
- `DESKTOP_ASSISTANT_EXECUTOR_PROMPT`

## Data Flow

### Chat Message Flow

```
1. User types message in Manager Window
   ↓
2. Frontend sends POST /api/chat to Agent Service
   ↓
3. Router analyzes message intent
   ↓
4. Planner creates PlannedToolCall(s)
   ↓
5. Guard validates against permissions
   ↓
6. Executor creates AgentTask(s)
   ↓
7. Response returned to frontend
   ↓
8. If needs confirmation: show dialog
   If approved: Desktop executes via Tauri commands
   ↓
9. Result sent back to Agent Service
   ↓
10. Task status updated, audit log written
```

### Settings Persistence Flow

```
1. User modifies settings in Settings Window
   ↓
2. Frontend calls Tauri command save_settings_bundle
   ↓
3. Rust backend writes to settings.json
   ↓
4. Also sends PUT /api/settings to Agent Service
   ↓
5. Agent Service updates its in-memory cache
   ↓
6. Audit log entry created
```

## Security Model

### Permission System

Three-layer security:

1. **Whitelist-based Permissions** (`permissions.json`)
   - `allowedApps`: List of app IDs that can be launched
   - `allowedDirectories`: List of directories for file search
   - `allowedCommands`: List of command IDs that can be executed

2. **Risk Assessment**
   - `low`: Safe operations (e.g., open URL, show date)
   - `medium`: Potentially sensitive (e.g., open app, list files)
   - `high`: Dangerous operations (future: file deletion, system commands)

3. **Confirmation Requirement**
   - `dangerousActionConfirmation` setting
   - Automatically required for medium/high risk operations
   - Can be explicitly set per tool call

### Audit Logging

All operations are logged to JSONL files:
- **Source**: `desktop` or `agent-service`
- **Action**: Tool name or operation type
- **Status**: `success` or `failure`
- **Summary**: Human-readable description
- **Detail**: Additional context (optional)
- **Timestamp**: ISO 8601 format

## Build System

### Monorepo Structure

**Package Manager**: pnpm with workspaces

**Workspace Configuration** (`pnpm-workspace.yaml`):
```yaml
packages:
  - apps/*
  - packages/*
```

### Build Commands

**Development:**
```bash
pnpm dev                    # Run both desktop and agent-service
pnpm dev:desktop           # Desktop app only (Next.js dev server)
pnpm dev:agent             # Agent service only
pnpm tauri:dev             # Desktop app with Tauri runtime
```

**Production:**
```bash
pnpm build                 # Build all packages
pnpm build:desktop:pyqt    # Build PyQt5 version (alternative)
pnpm tauri:build           # Build Tauri installer
```

**Quality:**
```bash
pnpm lint                  # Run ESLint on all packages
pnpm typecheck             # Run TypeScript compiler checks
```

## Deployment

### Desktop App Distribution

**Platforms:**
- Windows: `.msi` installer, `.exe` portable
- macOS: `.dmg` disk image (Intel & Apple Silicon)
- Linux: `.deb`, `.rpm`, `.AppImage`

**Build Artifacts:**
- Installer size: ~20MB (compressed)
- Runtime memory: <50MB
- Startup time: <2 seconds

### Agent Service

The agent service is bundled with the desktop app and runs as a child process:
- Launched automatically on app startup
- Listens on `localhost:4343`
- Terminated when app closes

## Technology Decisions

### Why Tauri?

- **Small bundle size**: ~20MB vs Electron's ~100MB+
- **Low memory usage**: <50MB vs Electron's ~200MB+
- **Native performance**: Rust backend
- **Security**: No Node.js in production bundle
- **Cross-platform**: Single codebase for Windows/macOS/Linux

### Why Next.js?

- **Static export**: `output: "export"` for Tauri integration
- **React 19**: Latest features and performance
- **App Router**: Modern routing with layouts
- **TypeScript**: Full type safety
- **Fast Refresh**: Excellent DX

### Why Separate Agent Service?

- **Isolation**: AI logic separate from UI
- **Testability**: Easy to test orchestration logic
- **Flexibility**: Can swap AI providers without touching UI
- **Security**: Additional permission layer
- **Auditability**: Centralized logging

### Why Monorepo?

- **Code sharing**: Types, configs, prompts shared across apps
- **Atomic changes**: Update types in one place
- **Consistent tooling**: Single lint/typecheck/build setup
- **Simplified dependencies**: Workspace protocol for internal packages

## Future Enhancements

### Planned Features

1. **AI Integration**
   - OpenAI API integration for natural language chat
   - Codex model for code-related tasks
   - Prompt engineering and context management

2. **Advanced Tools**
   - File read/write operations
   - Git operations (status, commit, push)
   - Terminal command execution
   - Web scraping and data extraction

3. **Memory System**
   - Conversation history persistence
   - User preference learning
   - Project context awareness
   - Long-term memory with embeddings

4. **Multi-Pet Support**
   - Multiple Live2D models
   - Pet personality customization
   - Pet-specific behaviors and responses

5. **Plugin System**
   - Third-party tool integration
   - Custom command registration
   - Extension marketplace

### Technical Debt

1. **Type Safety**
   - Remove `ignoreBuildErrors` from Next.js config
   - Fix all TypeScript errors
   - Add strict mode to all packages

2. **Build System**
   - Add proper build steps for shared packages
   - Implement incremental builds
   - Optimize bundle size

3. **Testing**
   - Unit tests for agent service
   - Integration tests for tool execution
   - E2E tests for critical flows

4. **Documentation**
   - API documentation for agent service
   - Component documentation for UI
   - Contribution guidelines

## Performance Characteristics

### Desktop App
- **Startup**: <2 seconds cold start
- **Memory**: 30-50MB idle, 80-120MB with Live2D
- **CPU**: <1% idle, 2-5% during animations
- **Disk**: ~20MB installed

### Agent Service
- **Startup**: <500ms
- **Memory**: 20-30MB
- **Response time**: <50ms for routing, <200ms for planning
- **Throughput**: 100+ requests/second (local HTTP)

## Development Guidelines

### Code Organization

- **Feature-based structure**: Group by feature, not by type
- **Colocation**: Keep related files together
- **Barrel exports**: Use index files for clean imports
- **Type-first**: Define types before implementation

### Naming Conventions

- **Files**: kebab-case (`chat-panel.tsx`)
- **Components**: PascalCase (`ChatPanel`)
- **Functions**: camelCase (`handleChat`)
- **Constants**: UPPER_SNAKE_CASE (`AGENT_SERVICE_PORT`)
- **Types**: PascalCase (`ChatMessage`)

### Git Workflow

- **Branch naming**: `feature/`, `fix/`, `refactor/`
- **Commit messages**: Conventional Commits format
- **PR size**: Keep PRs focused and reviewable
- **Testing**: All changes must pass lint and typecheck

## Troubleshooting

### Common Issues

1. **Agent service not starting**
   - Check port 4343 is not in use
   - Verify data directory permissions
   - Check logs in `~/AppData/Roaming/BongoCat/logs/`

2. **Live2D model not loading**
   - Verify model files in `resources/` directory
   - Check browser console for errors
   - Ensure WebGL is supported

3. **Hotkeys not working**
   - Check for conflicts with other apps
   - Verify permissions on macOS
   - Try re-registering in settings

4. **Build failures**
   - Clear `node_modules` and reinstall: `pnpm install`
   - Clear Next.js cache: `rm -rf apps/desktop/.next`
   - Clear Tauri cache: `rm -rf apps/desktop/src-tauri/target`

## References

- [Tauri Documentation](https://tauri.app/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Live2D Cubism SDK](https://www.live2d.com/en/sdk/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
