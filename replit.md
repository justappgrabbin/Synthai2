# YOU–N–I–VERSE Studio

## Overview

YOU–N–I–VERSE Studio (The Indyverse) is a creative development environment that combines a browser-based IDE, game creation tools, and AI-powered assistance. The platform features a cosmic-themed interface with a persistent AI assistant ("Guard Dog") and multiple creative workspaces accessible through a central dashboard hub.

**Core Features:**
- Browser-based code editor with file system management (localStorage persistence)
- Game template library with pre-built examples (platformer, space shooter, puzzle games)
- Grove Store - Community marketplace for apps, agents, templates, and tools
- ZIP file player for exploring bundled creative projects
- Multi-backend AI assistant (Claude, GPT, CodeLlama, DeepSeek, Grok)
- Global navigation menu for quick access to all panels
- Portal-based dashboard with cosmic-themed interface
- Lavender (#9b87f5) accent theme throughout

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework Stack:**
- React 18 with TypeScript
- Vite for build tooling and development server
- Wouter for lightweight client-side routing
- TanStack Query for server state management
- shadcn/ui component library (Radix UI primitives with Tailwind CSS)

**Styling Approach:**
- Tailwind CSS with custom design tokens
- CSS variables for theme management (supports light/dark modes)
- "New York" style variant from shadcn/ui
- Custom spacing system (2, 4, 8, 12, 16 units)
- Typography: Inter/SF Pro Display for UI, JetBrains Mono/Fira Code for code, Space Grotesk for headings

**Application Structure:**
- Dashboard serves as central navigation hub (home world)
- Eight main panels: Dashboard, GroveStore, IDE (DeveloperPanel), GameCreator, GANTrainer, PlayerPanel, AgentPanel, SettingsPanel
- TopNav component provides global navigation across all panels (except Dashboard which uses portal cards)
- Each panel is a full-page component accessed via routes
- Persistent AI Assistant overlay available globally across all views

**Routes:**
- `/` - Dashboard (portal gateway)
- `/grove-store` - Grove Store (community marketplace)
- `/ide` - Developer Panel (code editor with file management)
- `/game-creator` - Game Creator (template browser)
- `/gan-trainer` - GAN Trainer (neural network training with TensorFlow.js)
- `/player` - Player Panel (ZIP file viewer with User Creations library)
- `/agents` - Agent Panel (AI agent management)
- `/settings` - Settings Panel (AI backend configuration)

**State Management:**
- LocalStorage for file system persistence (IDE files)
- LocalStorage for AI backend configuration and API keys
- In-memory state for UI interactions
- No global state management library (component-level state only)

**Key Design Patterns:**
- Portal-based navigation (each section entry feels dimensional)
- Cosmic professionalism aesthetic (technical precision + universe-inspired visuals)
- Persistent AI presence (always accessible, never intrusive)
- Component composition over configuration

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- HTTP-only server (no WebSocket implementation currently)
- Middleware-based request handling
- Custom logging for API routes

**Development vs Production:**
- Vite dev server in development mode with HMR
- Static file serving in production
- Replit-specific plugins for development tooling

**Database Layer:**
- Drizzle ORM configured for PostgreSQL
- Schema definition in shared folder for type safety
- Basic user table defined (username/password)
- Currently using in-memory storage implementation (MemStorage class)
- Database configured but not actively used in current features

**API Design:**
- RESTful pattern expected (routes prefixed with /api)
- Storage interface abstraction for CRUD operations
- No authentication/authorization implemented yet

**File Organization:**
- `/server` - Backend code (Express server, routes, storage)
- `/client` - Frontend React application
- `/shared` - Shared types and schemas (Drizzle schema, Zod validators)

### External Dependencies

**AI Services (Multi-Backend):**
- Anthropic Claude API (requires API key)
- OpenAI GPT API (requires API key)
- DeepSeek API (requires API key)
- Grok API (requires API key)
- CodeLlama via Ollama (local, no key required - localhost:11434)
- AIService router handles backend selection and API calls
- API keys stored in localStorage with backend-specific prefixes

**UI Component Library:**
- Radix UI primitives (dialogs, dropdowns, tooltips, etc.)
- Full shadcn/ui component suite installed
- Lucide React for icons
- date-fns for date manipulation

**Development Tools:**
- Neon Database serverless driver (@neondatabase/serverless)
- Drizzle Kit for database migrations
- ESBuild for production server bundling
- Replit-specific Vite plugins (cartographer, dev-banner, runtime-error-modal)

**Utility Libraries:**
- clsx + tailwind-merge for className composition
- class-variance-authority for component variants
- react-hook-form + Zod resolvers for form handling
- JSZip for handling .zip file uploads in PlayerPanel
- nanoid for ID generation

**Frontend Routing:**
- Wouter (lightweight React router)
- Client-side only (no SSR)

**Notable Architecture Decisions:**
- File system persistence uses localStorage (not server-side storage)
- AI conversations happen client-side with direct API calls to providers
- Game templates and Grove Store items stored as static data structures in code
- Grove Store currently displays curated community items (static data, no backend API yet)
- No user authentication currently implemented despite user schema existing
- PostgreSQL configured but currently using in-memory storage fallback

## Recent Changes (October 25, 2025)

### Grove Store Launch
Added community marketplace feature for discovering and downloading apps, agents, templates, and tools:
- **Location**: `/grove-store` route, `client/src/components/GroveStore.tsx`
- **Features**: Category filtering (All, Agents, Apps, Templates, Tools), search functionality, featured items section
- **UI Elements**: Store item cards with ratings, download counts, tags, and author information
- **Sample Content**: 10 curated items across all categories (currently static data)
- **Future Enhancements**: Backend API for real submissions, user uploads, ratings system

### Global Navigation Menu
Replaced per-panel back buttons with unified TopNav component:
- **Component**: `client/src/components/TopNav.tsx`
- **Features**: Persistent navigation bar with icons and labels, active state highlighting, responsive design
- **Navigation Items**: Dashboard, Grove Store, IDE, Games, GAN Trainer, Player, Agents, Settings
- **Active Detection**: Uses wouter's useLocation() to highlight current page
- **Design**: Lavender accent for active items, ghost variant for inactive items

### GAN Trainer Panel
Added neural network training capabilities with TensorFlow.js:
- **Location**: `/gan-trainer` route, `client/src/components/GANTrainer.tsx`
- **Features**: GAN template library, trainable and pre-trained model support
- **Templates**: Simple GAN with TensorFlow.js implementation (generative adversarial network)
- **Integration**: Templates load directly into IDE for modification and customization
- **Technology**: Browser-based training using TensorFlow.js, no server required

### User Creations Library
Added tracking system for uploaded projects in Player Panel:
- **Storage**: `client/src/lib/userCreations.ts` manages localStorage persistence
- **Features**: Two-tab interface ("Current Project" and "User Creations")
- **Functionality**: Automatically saves uploaded zip metadata, displays creation cards with file counts and dates
- **Management**: Users can delete creations from their library
- **Integration**: Works seamlessly with zip file upload system