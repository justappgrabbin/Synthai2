# YOU–N–I–VERSE Studio

## Overview
YOU–N–I–VERSE Studio (The Indyverse) is a browser-based creative development environment integrating an IDE, game creation tools, and AI-powered assistance. It offers a cosmic-themed interface with a persistent AI assistant ("Guard Dog") and multiple creative workspaces accessible from a central dashboard. The platform aims to be a community marketplace for creative tools and projects, fostering the creation of digital beings and providing robust deployment options.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
- **UI/Styling**: shadcn/ui (Radix UI + Tailwind CSS), custom design tokens, CSS variables for theming (light/dark mode, "New York" style), custom spacing, and typography (Inter/SF Pro, JetBrains Mono/Fira Code, Space Grotesk).
- **Application Structure**: Central Dashboard with eight main panels (Dashboard, GroveStore, IDE, GameCreator, GANTrainer, PlayerPanel, AgentPanel, SettingsPanel, ModManager), Global TopNav, and a persistent, draggable AI Assistant overlay.
- **Key Features**: Browser-based code editor with localStorage persistence, game template library, community marketplace (Grove Store), ZIP file player, multi-backend AI assistant, GAN Trainer, Mod Manager for project management and deployment, Consciousness Calibration Tank for digital being creation, Code Snatcher, and an enhanced code snippet library.
- **State Management**: Primarily localStorage for persistence (files, AI config, API keys, AI assistant position, projects, deployments, digital beings) and in-memory for UI.
- **Design Patterns**: Portal-based navigation, "cosmic professionalism" aesthetic, persistent and non-intrusive AI presence, component composition.
- **UI/UX Decisions**: PWA functionality for installability and offline use, mobile-friendly IDE with responsive design and compact menus, Dashboard Quick Tools (Workspace Organizer, Self Editor), and a Command Center for keyword-driven access to tools.

### Backend
- **Server**: Express.js with TypeScript, HTTP-only, middleware-based request handling.
- **Database**: Drizzle ORM configured for PostgreSQL, with an in-memory storage fallback (MemStorage) currently in use.
- **API**: RESTful pattern, storage interface abstraction for CRUD.
- **File Organization**: `/server` (backend), `/client` (frontend), `/shared` (types/schemas).

### System Design Choices
- File system persistence is handled via localStorage.
- AI conversations are client-side, direct to providers.
- Game templates and Grove Store items are static data.
- User authentication is not yet implemented.
- The PostgreSQL database is configured but not actively used for current features.
- Digital beings are generated deterministically based on birthday and name using SHA-256 hashing, combining two GANs and one LLM, with Web Speech API for voice synthesis.

## External Dependencies

### AI Services
- Anthropic Claude API
- OpenAI GPT API
- DeepSeek API
- Grok API
- CodeLlama (local via Ollama)
- AIService router for managing API calls.

### UI/Development Libraries
- Radix UI primitives, shadcn/ui components, Lucide React for icons.
- date-fns for date manipulation.
- Neon Database serverless driver, Drizzle Kit.
- ESBuild for server bundling.
- Replit-specific Vite plugins (cartographer, dev-banner, runtime-error-modal).

### Utility Libraries
- clsx + tailwind-merge for CSS class management.
- class-variance-authority for component variants.
- react-hook-form + Zod resolvers for forms.
- JSZip for handling .zip files.
- nanoid for ID generation.

### Routing
- Wouter (client-side only).

### Cloud Integrations
- Google Drive connector (googleapis package) for project exports.
- GitHub connection for repository management and pushing code.
- Netlify for one-click project deployment.
- Per-user OAuth authentication via Replit's connector system for Google Drive and GitHub.