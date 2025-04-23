# NDISuite Report Generator

A comprehensive AI-powered NDIS (National Disability Insurance Scheme) report generation application with advanced transcription and content generation capabilities.

## Features

- **Real-time audio transcription** using OpenAI's Whisper API
- **AI-powered report generation** with context-aware content creation
- **Document processing** for PDF, DOCX, and TXT files
- **Retrieval Augmented Generation (RAG)** using LangChain for improved content relevance
- **Dark-themed, user-friendly interface** with professional styling
- **Export options** in multiple formats (PDF, DOCX)
- **Session management** for organizing related reports and materials

## Technology Stack

### Backend (Django)
- Django REST Framework for robust API endpoints
- PostgreSQL for structured data storage
- MongoDB for unstructured data (optional)
- Redis for caching and queue management
- Celery for background task processing
- OpenAI API for AI capabilities (Whisper, GPT models)
- LangChain for RAG implementation

### Frontend (Next.js)
- Next.js with server-side rendering
- TypeScript for type safety
- Tailwind CSS for styling
- Dark theme UI (#1E1E1E background, #2D2D2D panels)
- Responsive design for all device sizes

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker and Docker Compose (optional, for containerized setup)

### Environment Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ndisuite-report-generator-app.git
   cd ndisuite-report-generator-app
   ```

2. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file to configure your environment variables, including your OpenAI API key.

3. **OpenAI API Requirements**:
   - API Key: This application uses a project-based API key format
   - Required library versions:
     - OpenAI library version 1.66.0+
     - HTTPX 0.27.0+

### Installation

#### Option 1: Docker (Recommended)

1. Start all services using Docker Compose:
   ```
   docker-compose up -d
   ```

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api

#### Option 2: Manual Setup

1. Set up the backend:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

2. Start Celery workers (in a separate terminal):
   ```
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   celery -A ndisuite worker -l INFO
   ```

3. Start the frontend (in a separate terminal):
   ```
   cd frontend
   npm install
   npm run dev
   ```

## Project Structure

```
ndisuite-report-generator-app/
├── .github/workflows/    # CI/CD configuration
├── backend/              # Django backend
│   ├── ndisuite/         # Main Django project
│   ├── users/            # User authentication
│   ├── reports/          # Report management
│   ├── transcription/    # Audio transcription
│   └── files/            # Document processing
├── frontend/             # Next.js frontend
│   ├── public/           # Static assets
│   └── src/              # Source code
│       ├── api/          # API client
│       ├── components/   # React components
│       ├── pages/        # Next.js pages
│       └── styles/       # CSS and styling
└── docker-compose.yml    # Docker configuration
```

## Usage

1. **Authentication**: Register for an account or log in with existing credentials.

2. **Dashboard**: Manage your reports and sessions from the dashboard.

3. **Creating Reports**:
   - Record audio for real-time transcription
   - Upload documents for processing
   - Use existing templates or create custom ones

4. **Editing Reports**:
   - Use the AI-powered report builder
   - Add/edit sections as needed
   - Generate AI content for specific sections

5. **Exporting Reports**:
   - Preview your report
   - Export as PDF or DOCX
   - Share via a secure link

## Development

### Running Tests

```
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test
```

### CI/CD Pipeline

The project includes a GitHub Actions workflow for continuous integration and deployment:

- Automated testing for both backend and frontend
- Code quality checks
- Docker image building
- Automated deployment (when configured)

## License

[MIT License](LICENSE)

## Acknowledgements

- OpenAI for providing the AI capabilities
- The Django and Next.js communities for their excellent frameworks
- LangChain for RAG implementation tools
