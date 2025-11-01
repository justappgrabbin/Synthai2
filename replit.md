# YOU–N–I–VERSE Studio

## Overview
YOU–N–I–VERSE Studio (The Indyverse) is a browser-based creative development environment that integrates an IDE, game creation tools, and AI-powered assistance. It features a cosmic-themed interface with a persistent AI assistant ("Guard Dog") and multiple creative workspaces accessible from a central dashboard. The platform aims to be a community marketplace for creative tools and projects, fostering the creation of digital beings and providing robust deployment options. Key capabilities include generating semantic worlds, creating digital consciousness, and managing creative assets.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
- **UI/Styling**: shadcn/ui (Radix UI + Tailwind CSS), custom design tokens, CSS variables for theming (light/dark mode, "New York" style), custom spacing, and typography.
- **Application Structure**: Central Dashboard with nine main panels (Dashboard, GroveStore, IDE, GameCreator, GANTrainer, PlayerPanel, AgentPanel, SettingsPanel, ModManager, UniverseCreator), Global TopNav, and a persistent, draggable AI Assistant overlay.
- **Key Features**: Browser-based code editor, game template library, community marketplace (Grove Store), ZIP file player, multi-backend AI assistant, GAN Trainer, Mod Manager for project management, Consciousness Calibration Tank for digital being creation, Semantic Universe Creator for text-to-world generation with 3D playable viewer, Code Snatcher, and an enhanced code snippet library.
- **State Management**: Primarily localStorage for persistence (files, AI config, API keys, AI assistant position, projects, deployments, digital beings) and in-memory for UI.
- **Design Patterns**: Portal-based navigation, "cosmic professionalism" aesthetic, persistent and non-intrusive AI presence.
- **UI/UX Decisions**: PWA functionality, mobile-friendly IDE, Dashboard Quick Tools (Workspace Organizer, Self Editor), Command Center for keyword-driven access.
- **3D Universe Viewer**: Interactive 3D visualization of semantic universes using Three.js/React-Three-Fiber, featuring a seven-layer 3D mapping (terrain, particle systems, interactive objects, dynamic spheres, camera perspectives, lighting ambience, procedural envelope).

### Backend
- **Server**: Express.js with TypeScript, HTTP-only.
- **Database**: Drizzle ORM configured for PostgreSQL, with an in-memory storage fallback (MemStorage) currently in use.
- **API**: RESTful pattern, storage interface abstraction for CRUD.
- **StoryForge Integration**: Full semantic world generation pipeline including a symbolic parser, LLM observer, and GAN stubs for text-to-world transformation.
- **Consciousness Calibration**: Features 7 chart calculators based on astronomical calculations (Natal, Transit, Progressed, Solar Return, Lunar Return, Composite, Draconic Charts) integrated with HuggingFace LLM interpretation and Voice GAN Synthesis for each consciousness layer.

### System Design Choices
- File system persistence via localStorage.
- AI conversations are client-side, direct to providers.
- Game templates and Grove Store items are static data.
- User authentication is not yet implemented.
- PostgreSQL database is configured but not actively used for current features.
- Consciousness Calibration Tank: Avatar-first workflow for building neural networks using 2-5 GANs/LLMs, generating integration code.
- Semantic Universe Creator: Text-to-world generation using a seven-layer semantic framework, supporting Oracle Mode (birthday-based), random generation, token economy, and a universe library.

## External Dependencies

### AI Services
- Anthropic Claude API
- OpenAI GPT API
- DeepSeek API
- Grok API
- CodeLlama (local via Ollama)
- AIService router for managing API calls.
- HuggingFace (Mistral-7B-Instruct) for consciousness insights.

### UI/Development Libraries
- Radix UI primitives, shadcn/ui components, Lucide React for icons.
- date-fns for date manipulation.
- Neon Database serverless driver, Drizzle Kit.
- ESBuild for server bundling.
- Replit-specific Vite plugins (cartographer, dev-banner, runtime-error-modal).
- Three.js, @react-three/fiber, @react-three/drei for 3D visualization.

### Utility Libraries
- clsx + tailwind-merge for CSS class management.
- class-variance-authority for component variants.
- react-hook-form + Zod resolvers for forms.
- JSZip for handling .zip files.
- nanoid for ID generation.
- Astronomy Engine for accurate planetary positions.

### Routing
- Wouter (client-side only).

### Cloud Integrations
- Google Drive connector (googleapis package) for project exports.
- GitHub connection for repository management.
- Netlify for one-click project deployment.
- Per-user OAuth authentication via Replit's connector system for Google Drive and GitHub.