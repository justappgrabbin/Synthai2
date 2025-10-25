# YOU–N–I–VERSE Studio

## Overview
YOU–N–I–VERSE Studio (The Indyverse) is a browser-based creative development environment that integrates an IDE, game creation tools, and AI-powered assistance. It features a cosmic-themed interface with a persistent AI assistant ("Guard Dog") and multiple creative workspaces accessible from a central dashboard. The platform aims to be a community marketplace for creative tools and projects.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
- **UI/Styling**: shadcn/ui (Radix UI + Tailwind CSS), custom design tokens, CSS variables for theming (light/dark mode), "New York" style variant, custom spacing, and specific typography (Inter/SF Pro, JetBrains Mono/Fira Code, Space Grotesk).
- **Application Structure**: Central Dashboard with eight main panels (Dashboard, GroveStore, IDE, GameCreator, GANTrainer, PlayerPanel, AgentPanel, SettingsPanel). Global TopNav for navigation, and a persistent AI Assistant overlay.
- **Key Features**: Browser-based code editor with localStorage persistence, game template library, community marketplace (Grove Store), ZIP file player, multi-backend AI assistant, and a GAN Trainer using TensorFlow.js.
- **State Management**: Primarily localStorage for persistence (files, AI config, API keys) and in-memory for UI.
- **Design Patterns**: Portal-based navigation, "cosmic professionalism" aesthetic, persistent and non-intrusive AI presence, component composition.

### Backend
- **Server**: Express.js with TypeScript, HTTP-only (no WebSockets), middleware-based request handling.
- **Database**: Drizzle ORM configured for PostgreSQL, with an in-memory storage fallback (MemStorage) currently in use.
- **API**: RESTful pattern, storage interface abstraction for CRUD.
- **File Organization**: `/server` (backend), `/client` (frontend), `/shared` (types/schemas).

### System Design Choices
- File system persistence handled via localStorage.
- AI conversations are client-side, direct to providers.
- Game templates and Grove Store items are static data.
- User authentication is not yet implemented.
- The PostgreSQL database is configured but not actively used for current features.
- Code Snatcher tool for extracting website HTML structures.
- Enhanced code snippet library with nested categories and 50+ snippets.
- Theme system with light/dark mode toggle and persistence.
- Mobile-friendly IDE with responsive design and preview toggle.

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