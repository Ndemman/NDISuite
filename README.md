# NDISuite Report Writer Backend

A modular backend-only Retrieval-Augmented Generation (RAG) system that processes audio, live recordings, and documents to generate structured reports.

## Overview

NDISuite Report Writer is a Django-based backend service that:

- Ingests audio files, live microphone recordings, and documents (PDF, DOCX, TXT)
- Transcribes audio content using OpenAI's Whisper API
- Processes and chunks content for effective retrieval
- Guides users to generate structured report outputs
- Supports post-generation editing/refinement
- Stores sessions for re-access while maintaining session boundary integrity

## Tech Stack

- **Framework**: Python + Django
- **AI Orchestration**: LangChain
- **Transcription**: OpenAI Whisper
- **Document Parsing**: PyMuPDF, python-docx
- **OCR Fallback**: Tesseract OCR
- **Database**: PostgreSQL
- **RAG Model**: GPT-3.5 Turbo (OpenAI)

## Installation

1. Clone this repository
2. Create and activate a virtual environment:
   ```
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   source venv/bin/activate  # Unix/MacOS
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Configure the `.env` file with your API keys and database settings
5. Set up PostgreSQL database
6. Run migrations:
   ```
   python manage.py makemigrations
   python manage.py migrate
   ```
7. Start the development server:
   ```
   python manage.py runserver
   ```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Model Settings
TRANSCRIPTION_MODEL=whisper-1
RAG_MODEL=gpt-3.5-turbo
REFINING_MODEL=gpt-3.5-turbo

# Database Configuration
DB_NAME=ndisuite_reports
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# Application Settings
DEBUG=True
SECRET_KEY=your_django_secret_key
```

## API Endpoints

### Session Management

- `GET /api/sessions/` - List all sessions
- `POST /api/sessions/create/` - Create a new session
- `GET /api/sessions/{session_id}/` - Get session details
- `PUT/PATCH /api/sessions/{session_id}/update/` - Update a session
- `POST /api/sessions/{session_id}/fields/create/` - Create an output field

### Transcription

- `GET /api/transcription/jobs/{job_id}/` - Get transcription job status
- `POST /api/transcription/jobs/{job_id}/process/` - Process a transcription job
- `GET /api/transcription/jobs/{job_id}/transcript/` - Get transcript details
- `POST /api/files/{file_id}/transcribe/` - Create a transcription job for an audio file

### RAG Engine

- `GET /api/sessions/{session_id}/vector-store/` - Get vector store info
- `POST /api/sessions/{session_id}/vector-store/create/` - Create a vector store
- `POST /api/fields/{field_id}/generate/` - Generate content for a field
- `GET /api/generations/{generation_id}/` - Get generation details
- `POST /api/configurations/{config_id}/generate-all/` - Generate content for all fields

### Refinement

- `POST /api/fields/{field_id}/refinement/start/` - Start a refinement session
- `GET /api/refinement/sessions/{session_id}/` - Get refinement session details
- `POST /api/refinement/sessions/{session_id}/highlight/` - Highlight text for refinement
- `POST /api/refinement/sections/{section_id}/instructions/` - Submit refinement instruction
- `POST /api/refinement/instructions/{instruction_id}/process/` - Process refinement instruction
- `POST /api/fields/{field_id}/refinement/apply/` - Apply all refinements to a field

### Output Management

- `GET /api/templates/` - List output templates
- `GET /api/templates/{template_id}/` - Get template details
- `POST /api/sessions/{session_id}/configuration/create/` - Create output configuration
- `POST /api/configurations/{config_id}/fields/add/` - Add a field to a configuration
- `POST /api/sessions/{session_id}/report/create/` - Create a report
- `GET /api/reports/{report_id}/` - Get report with content
- `POST /api/reports/{report_id}/finalize/` - Finalize a report
- `POST /api/configurations/{config_id}/template/create/` - Create template from configuration

## Workflow Example

1. Create a new session
2. Upload audio or document files to the session
3. Process the files (transcribe audio, parse documents)
4. Create vector store for the session
5. Create output configuration with desired fields
6. Generate content for each field using RAG
7. Refine content as needed
8. Create the final report
9. Finalize and export the report

## License

[MIT License](LICENSE)
