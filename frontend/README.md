# NDISuite Report Writer Frontend

A modern, responsive Next.js frontend for the NDISuite Report Writer system that processes audio, live recordings, and documents to generate structured reports with AI assistance.

## Overview

The NDISuite Report Writer Frontend is a Next.js-based application that provides:

- Comprehensive authentication system with JWT
- Intuitive file upload and audio recording interfaces
- Dynamic session management for organizing report generation
- AI-powered report generation with OpenAI integration
- Advanced text refinement and editing capabilities
- Multilingual support with Arabic/English language options
- Responsive design for all device sizes

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **State Management**: React Context API, Zustand
- **Authentication**: JWT-based auth
- **API Integration**: OpenAI API (v1.66.0+)

## Features

### Authentication
- JWT token management with refresh functionality
- User registration, login, and profile management
- Password reset and security features

### File Management
- Drag-and-drop file uploads
- Multi-file support
- Progress tracking
- Type validation

### Audio Recording
- Browser-based audio recording
- Audio visualization
- Playback controls

### Session Management
- Create and organize work sessions
- Track session status
- Offline-first with backend synchronization

### Report Generation
- AI-powered report generation
- Configurable output fields
- Multiple language support

### Text Refinement
- Text highlighting and annotation
- Section-based editing
- AI-assisted refinement with direct OpenAI API integration
- Refinement history tracking

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   cd frontend
   npm install
   ```
3. Configure environment variables - create a `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key-here
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## OpenAI Integration

The application has direct OpenAI API integration as a fallback mechanism when the backend is unavailable. The integration:

- Uses OpenAI API v1.66.0+ with HTTPX 0.27.0+ compatibility
- Supports GPT-4o, GPT-4 Turbo, and GPT-3.5 Turbo models
- Intelligently falls back to direct API calls when backend services are unavailable
- Provides seamless UX with sophisticated prompt construction
- Preserves all functionality even in offline or backend-down scenarios

## Backend Integration

This frontend is designed to work with the NDISuite Report Writer Backend. The system:

1. Attempts API connections first for all operations
2. Falls back to local storage and direct API calls when necessary
3. Synchronizes data when connectivity is restored
4. Maintains a consistent user experience regardless of backend availability

## Usage Workflow

1. Register/Login to access the dashboard
2. Create a new session
3. Upload files or record audio
4. Configure report settings (language, fields, etc.)
5. Generate report with AI assistance
6. Refine and edit content as needed
7. Finalize and export the report

## Development

### Project Structure

```
frontend/
├── public/          # Static assets
├── src/
│   ├── app/         # App router pages
│   ├── components/  # Reusable UI components
│   ├── contexts/    # React context providers
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Utility functions
│   ├── services/    # API services
│   ├── store/       # Zustand stores
│   ├── styles/      # Global styles
│   └── types/       # TypeScript type definitions
└── ...
```

### Key Components

- `auth-context.tsx` - Authentication management
- `session-context.tsx` - Session and report management
- `reportService.ts` - Report generation and OpenAI integration
- `rag-generator.tsx` - RAG generation interface
- `refinement-interface.tsx` - Text refinement system

## License

[MIT License](../LICENSE)
