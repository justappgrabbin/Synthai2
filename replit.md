# YOU–N–I–VERSE Studio

## Overview
YOU–N–I–VERSE Studio (The Indyverse) is a browser-based creative development environment integrating an IDE, game creation tools, and AI-powered assistance. It offers a cosmic-themed interface with a persistent AI assistant ("Guard Dog") and multiple creative workspaces accessible from a central dashboard. The platform aims to be a community marketplace for creative tools and projects, fostering the creation of digital beings and providing robust deployment options.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
- **UI/Styling**: shadcn/ui (Radix UI + Tailwind CSS), custom design tokens, CSS variables for theming (light/dark mode, "New York" style), custom spacing, and typography (Inter/SF Pro, JetBrains Mono/Fira Code, Space Grotesk).
- **Application Structure**: Central Dashboard with nine main panels (Dashboard, GroveStore, IDE, GameCreator, GANTrainer, PlayerPanel, AgentPanel, SettingsPanel, ModManager, UniverseCreator), Global TopNav, and a persistent, draggable AI Assistant overlay.
- **Key Features**: Browser-based code editor with localStorage persistence, game template library, community marketplace (Grove Store), ZIP file player, multi-backend AI assistant, GAN Trainer, Mod Manager for project management and deployment, Consciousness Calibration Tank for digital being creation, Semantic Universe Creator for text-to-world generation with 3D playable viewer, Code Snatcher, and an enhanced code snippet library.
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
- Consciousness Calibration Tank: Avatar-first workflow where users import avatars from you-n-i-verse.org, select 2-5 GANs/LLMs, build neural network connections, and auto-generate integration code.

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

## Recent Changes

### 3D Universe Viewer Launch (October 29, 2025) 🎮

**New Feature**: Interactive 3D visualization of semantic universes using Three.js/React-Three-Fiber

**Seven-Layer 3D Mapping**:
1. **Physical/Substrate** → Terrain mesh (ground plane with variable size)
2. **Energetic/Affective** → Particle systems (color/tone driven by emotional data)
3. **Perceptual/Semantic** → Interactive objects (cubes representing semantic relationships)
4. **Cognitive/Reasoning** → Dynamic sphere (animated based on action data)
5. **Reflective/Meta-Cognitive** → Camera perspective (first-person vs third-person)
6. **Transpersonal/Archetypal** → Lighting ambience (archetypal atmosphere)
7. **Void/Potential** → Procedural envelope (seed-driven wireframe shell with noise-based animation)

**Features**:
- First-person and third-person exploration modes
- OrbitControls for rotation, zoom, pan
- Fullscreen mode toggle
- Reset view to initial perspective
- Info panel with controls and universe data
- Sky, stars, and grid helpers for spatial context
- Real-time seed-driven procedural variation

**Technical Stack**:
- Three.js ^0.160.0 for WebGL rendering
- @react-three/fiber ^8.15.0 for React integration
- @react-three/drei ^9.92.0 for helpers (Sky, Stars, OrbitControls, Text)
- UniverseViewer3D component with fullscreen overlay
- Play button integrated into Universe Library cards

**Browser-Native**: No Unity required - runs directly in web browsers with WebGL support

### Semantic Universe Creator Launch (October 29, 2025) 🌌

**New Feature**: Text-to-world generation system using seven-layer semantic framework

**Core Functionality**:
1. **Text Input System**: Users describe universes in natural language
2. **Seven-Layer Semantic Parsing**: Breaks text into consciousness layers:
   - Physical/Substrate (nouns, objects, environment)
   - Energetic/Affective (emotion, tone, color)
   - Perceptual/Semantic (relations, symbols, categories)
   - Cognitive/Reasoning (verbs, actions, logic)
   - Reflective/Meta-Cognitive (perspective, tense)
   - Transpersonal/Archetypal (patterns, myths)
   - Void/Potential (latent creativity, seed)
3. **Token Economy**: 5 tokens/month, 1 token = 1 universe creation
4. **Universe Library**: Save, view, export created worlds with 3D playback
5. **Real-time Progress**: Visual feedback through each semantic layer
6. **Export System**: Download universe data as JSON

**Technical Implementation**:
- SemanticUniverseCreator component with tabs (Create, Library)
- Token wallet with monthly reset logic (localStorage)
- Semantic layer parser extracting linguistic features
- Universe storage in `semantic_universes` localStorage key
- Integrated into TopNav and Command Center
- Connected to UniverseViewer3D for playable 3D visualization

**Design Alignment**: Follows Guagan.pro semantic framework architecture for future GAN/LLM integration

**Use Case**: Foundation for connecting to backend semantic GANs, video GANs, and LLM observers to generate actual playable worlds

### Consciousness Calibration Tank Update (October 29, 2025) 🧬

**Major Redesign**: Removed birthday DNA generation; implemented avatar-first neural network builder

**New Workflow**:
1. **Avatar Import Required**: Users must bring avatar from you-n-i-verse.org (link provided in UI)
2. **Flexible Model Selection**: Add 2-5 models (GANs or LLMs in any combination)
3. **Visual Neural Network Builder**: Draw connections between models to create neural pathways
4. **Auto-Code Generation**: System generates complete `ConsciousnessCore` JavaScript class with:
   - Avatar loading logic
   - Model initialization (supports HuggingFace, OpenAI, custom models)
   - Connection routing based on visual builder
   - Processing pipeline
5. **Export & Save**: Download integration code or save project to localStorage

**Technical Changes**:
- Removed: Birthday-based DNA generation, deterministic seeding, voice synthesis
- Added: Avatar upload, dynamic model management, connection builder, code generator
- File storage: Projects saved to `consciousness_projects` localStorage key
- Code output: Fully functional JavaScript class ready for integration

**Use Case**: Creators building multi-model consciousness systems can now visually design neural network architecture and get production-ready integration code without writing it manually.