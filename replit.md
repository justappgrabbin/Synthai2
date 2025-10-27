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

### Cloud Integrations
- Google Drive connector (googleapis package) for project exports
- GitHub connection for repository management and pushing code
- Per-user OAuth authentication via Replit's connector system

## Recent Changes (October 25, 2025)

### PWA Installation & APK Conversion Ready 📱
Added complete Progressive Web App functionality:

**Install Prompt**
- Auto-appears for eligible users (not previously dismissed)
- Shows at bottom-right with install/dismiss options
- Persists user choice in localStorage
- Detects when app is running in standalone mode

**PWA Configuration** (Production-Ready)
- manifest.json: Complete with icons, shortcuts, share targets, screenshots
- Service Worker: Intelligent caching with offline fallback
- Icons: All 4 required sizes (192x192, 512x512, maskable variants)
- Apple Support: Touch icons, status bar styling, web-app-capable
- Theme Colors: Purple cosmic theme (#9b87f5)
- Share Target: Accepts .zip files from other apps → opens in ZIP Player

**APK Conversion Guide**
- PWABuilder.com integration (easiest method)
- Bubblewrap CLI instructions (developer method)
- Deployment options (Replit, Vercel, Netlify, GitHub Pages)
- Google Play Store distribution guide
- Complete testing checklist

**Files**:
- `client/src/components/InstallPrompt.tsx` - Install prompt UI
- `PWA-APK-GUIDE.md` - Complete PWA/APK documentation
- `client/public/manifest.json` - PWA manifest (already configured)
- `client/public/sw.js` - Service worker (already configured)
- `client/index.html` - Service worker registration (already configured)

### Cloud Integrations Added (Google Drive & GitHub)
Added professional export/publish features using Replit's built-in connectors:

**Google Drive Export** ☁️
- **Button**: "Drive" in IDE toolbar (Cloud icon)
- **Function**: One-click export entire project to user's Google Drive
- **Structure**: Preserves full directory hierarchy with nested folders
- **Auth**: Replit's Google Drive connector handles OAuth automatically
- **User Isolation**: Each user connects their own Google Drive account
- **Files**: Includes empty scaffold/placeholder files
- **Output**: Creates timestamped folder, opens in browser after upload
- **Error Handling**: Clear "not connected" messages with setup instructions

**GitHub Push** 🚀
- **Button**: "GitHub" in IDE toolbar (GitHub icon)  
- **Dialog**: Enter repository name
- **Function**: Push entire project to GitHub (creates or updates repo)
- **Auth**: Replit's GitHub connection handles OAuth automatically
- **User Isolation**: Each user pushes to their own GitHub account
- **Files**: Preserves directory structure, includes empty files
- **Commits**: Auto-message: "Update [file] from YOU–N–I–VERSE Studio"
- **Output**: Opens GitHub repo in browser after push

**Technical Details**:
- Backend: `server/lib/googleDriveService.ts`, `server/lib/githubService.ts`
- Routes: POST `/api/export/google-drive`, POST `/api/push/github`
- OAuth: Per-user tokens, automatic refresh, proper undefined guards
- Structure: Recursive folder creation with caching to prevent duplicates

### Theme System (Working)
- Component: `client/src/components/ThemeProvider.tsx`
- Settings toggle now functional (Sun/Moon icons)
- localStorage persistence + system preference detection
- Toggles `.dark` class on document root

### Code Snatcher Feature 🎣
- Dialog in IDE toolbar ("Snatch Code" button)
- Extract HTML wireframes from any URL
- Uses CORS proxy (allorigins.win)
- Creates `snatched-[timestamp].html` file
- Smart filtering (skips scripts/styles, preserves structure)

### Enhanced Code Snippet Library (50+ snippets)
- Nested dropdown categories for better organization
- **Core**: HTML (5), CSS (5), JavaScript (4), PWA/APK (4), Utilities (3), Forms (2), API (3), UI (4)
- **Advanced**: Game Functions (5), Auth (4), Animations (5), Data Operations (5), Mobile (4), Notifications (3), Payments (2)
- **UI**: Hover to expand categories, click to insert instantly

### AI Assistant Updates  
- Renamed to "AI Guard Dog 🐕"
- Friendlier welcome messages and setup guidance
- Explicitly lists all 5 backend options (Claude, GPT-4, DeepSeek, Grok, CodeLlama)

### Mobile UX Improvements (Latest)
Optimized mobile experience across the app:

**AI Assistant Button Positioning**
- Fixed positioning: Now at `bottom-4` on mobile (was `bottom-20`)
- Button no longer off-screen on mobile devices
- Properly accessible with thumb reach
- Adjusted InstallPrompt positioning to match

**IDE Panel Exit Buttons** ✖️
- All IDE panels now have visible close/exit buttons
- Files Panel: Exit button always visible (not just mobile)
- Code Editor: Close button appears when file is open
- Preview Panel: Exit button in header
- Terminal: Already had close functionality
- Self-Editor: Exit button in header with clear labeling
- Workspace Organizer: Exit button in header with clear labeling
- Consistent UI across all panels for better user control

**IDE Mobile Menu** 📱
- Desktop: Full menubar with File, Edit, View, Run, Snippets, Tools, Help
- Mobile (<md): Compact dropdown menu with essential actions
- Mobile menu includes: File Panel toggle, Terminal toggle, Preview toggle, New File, Save, Run, Code Snatcher, GitHub/Drive export, Download, Send to Store
- Terminal is now viewable on phones without menubar obstruction
- Space-efficient design for small screens

**AgentPanel Touch Improvements**
- Increased icon sizes from 12px to 16px for better visibility
- Improved touch targets with `size="sm"` buttons
- Minimum width added to icon-only buttons
- All buttons properly sized for mobile interaction