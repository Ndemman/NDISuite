# NDISuite Report Generator Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Development](#backend-development)
3. [Frontend Development](#frontend-development)
4. [API Reference](#api-reference)
5. [Real-time Communication](#real-time-communication)
6. [AI Integration](#ai-integration)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Contributing Guidelines](#contributing-guidelines)

## Architecture Overview

The NDISuite Report Generator uses a full-stack architecture with:

- **Backend**: Django REST Framework for API services
- **Frontend**: Next.js with React and TypeScript
- **Database**: PostgreSQL for structured data, MongoDB for vector storage (optional)
- **Cache & Queue**: Redis and Celery for background tasks
- **AI Services**: OpenAI and LangChain integrations

### System Diagram

```
+---------------+     +----------------+     +-----------------+
|               |     |                |     |                 |
|    Frontend   |<--->|  Backend API   |<--->|    Databases    |
| (Next.js/SSR) |     | (Django REST)  |     | (PostgreSQL/    |
|               |     |                |     |  MongoDB)       |
+---------------+     +----------------+     +-----------------+
        ^                     ^                      ^
        |                     |                      |
        v                     v                      v
+---------------+     +----------------+     +-----------------+
|               |     |                |     |                 |
| WebSockets    |     | Background     |     | AI Services     |
| (Transcription|     | Processing     |     | (OpenAI/        |
|  Service)     |     | (Celery)       |     |  LangChain)     |
+---------------+     +----------------+     +-----------------+
```

## Backend Development

### Project Structure

```
backend/
├── ndisuite/          # Main project settings
├── users/             # User authentication/profiles
├── reports/           # Report generation 
├── transcription/     # Audio transcription
├── files/             # Document processing
└── tests/             # Test suites
```

### Environment Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your environment-specific settings
   ```

4. Run database migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Model Design

#### Core Models

1. **User Model** (`users/models.py`)
   - Custom user model with UUID primary key
   - Extended profile information
   - Authentication tokens

2. **Session Model** (`reports/models.py`)
   - Represents a report generation session
   - Contains metadata about the report process
   - Links to all related resources

3. **Report Model** (`reports/models.py`)
   - The primary output of the system
   - Contains structured content sections
   - Version history

4. **Transcript Model** (`transcription/models.py`)
   - Stores audio transcription results
   - Segments for real-time updates
   - Linked to sessions

5. **InputFile Model** (`files/models.py`)
   - Handles uploaded documents
   - Tracks processing status
   - Links to extracted content

### Adding a New API Endpoint

1. Create a serializer in `app_name/serializers.py`:
   ```python
   from rest_framework import serializers
   from .models import YourModel

   class YourModelSerializer(serializers.ModelSerializer):
       class Meta:
           model = YourModel
           fields = ['field1', 'field2', ...]
   ```

2. Create a viewset in `app_name/views.py`:
   ```python
   from rest_framework import viewsets
   from .models import YourModel
   from .serializers import YourModelSerializer
   
   class YourModelViewSet(viewsets.ModelViewSet):
       queryset = YourModel.objects.all()
       serializer_class = YourModelSerializer
       permission_classes = [IsAuthenticated]
   ```

3. Register the viewset in `app_name/urls.py`:
   ```python
   from django.urls import path, include
   from rest_framework.routers import DefaultRouter
   from .views import YourModelViewSet
   
   router = DefaultRouter()
   router.register(r'your-models', YourModelViewSet)
   
   urlpatterns = [
       path('', include(router.urls)),
   ]
   ```

## Frontend Development

### Project Structure

```
frontend/
├── public/           # Static assets
├── src/
│   ├── api/          # API client services
│   ├── components/   # Reusable UI components
│   ├── context/      # React Context providers
│   ├── hooks/        # Custom React hooks
│   ├── pages/        # Next.js page components
│   ├── styles/       # CSS and styling
│   └── utils/        # Utility functions
├── tailwind.config.js # Tailwind CSS configuration
└── next.config.js    # Next.js configuration
```

### Environment Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your environment-specific settings
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Adding a New Component

1. Create the component file in `src/components/`:
   ```tsx
   import React from 'react';
   
   interface YourComponentProps {
     prop1: string;
     prop2?: number;
   }
   
   export function YourComponent({ prop1, prop2 = 0 }: YourComponentProps) {
     return (
       <div className="bg-[#2D2D2D] p-4 rounded-lg">
         <h2 className="text-white text-xl">{prop1}</h2>
         {prop2 > 0 && <p className="text-gray-300">{prop2}</p>}
       </div>
     );
   }
   ```

2. Import and use the component:
   ```tsx
   import { YourComponent } from '@/components/YourComponent';
   
   export default function SomePage() {
     return (
       <div>
         <YourComponent prop1="Hello" prop2={42} />
       </div>
     );
   }
   ```

### API Communication

Use the API client services for backend communication:

```tsx
// In your component or page:
import { useEffect, useState } from 'react';
import { someApiService } from '@/api/someApiService';

export function DataComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await someApiService.getData();
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) return <p>Loading...</p>;
  
  return (
    <div>
      {/* Render your data */}
    </div>
  );
}
```

## Real-time Communication

The system uses WebSocket connections for real-time audio transcription:

### Backend WebSocket Consumer

```python
# transcription/consumers.py
class TranscriptionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Setup connection
        self.user = self.scope["user"]
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        await self.accept()
        
    async def receive(self, text_data=None, bytes_data=None):
        # Handle received audio data
        if bytes_data:
            await self.process_audio_chunk(bytes_data)
            
    async def process_audio_chunk(self, chunk_data):
        # Process audio data through transcription service
        # Send transcription results back to client
```

### Frontend WebSocket Integration

```typescript
// api/transcriptionService.ts
export const startRecording = (sessionId: string) => {
  const ws = new WebSocket(`wss://api.ndisuite.app/ws/transcription/${sessionId}/`);
  
  ws.onopen = () => {
    console.log('WebSocket connection established');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle transcription update
  };
  
  // Return the WebSocket instance for later use
  return ws;
};
```

## AI Integration

### OpenAI Configuration

The application uses OpenAI for transcription and content generation:

```python
# settings.py or .env

TRANSCRIPTION_MODEL = "whisper-1"
GENERATION_MODEL = "gpt-4-turbo"
EMBEDDING_MODEL = "text-embedding-3-large"
```

**Important Notes:**
- Requires OpenAI library v1.66.0+ and HTTPX v0.27.0+
- API keys should never be hardcoded in source files
- Use environment variables or secure key management

### LangChain Integration

The system uses LangChain for RAG (Retrieval Augmented Generation):

```python
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI

# Initialize embeddings and vector store
embeddings = OpenAIEmbeddings(model=settings.EMBEDDING_MODEL)
vector_store = Chroma(
    collection_name="document_chunks",
    embedding_function=embeddings,
    persist_directory=settings.VECTOR_STORE_PATH
)

# Initialize QA chain
llm = ChatOpenAI(model_name=settings.GENERATION_MODEL)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vector_store.as_retriever()
)
```

## Testing

### Running Backend Tests

```bash
cd backend
python manage.py test
```

### Running Frontend Tests

```bash
cd frontend
npm test
```

### End-to-End Testing

```bash
npm run test:e2e
```

## Deployment

See the [Deployment Guide](./deployment_guide.md) for detailed information on deploying the application to production environments.

## Contributing Guidelines

### Code Style

- **Python**: Follow PEP 8 guidelines
- **JavaScript/TypeScript**: Use ESLint with the project config
- **Commit Messages**: Use conventional commits format

### Pull Request Process

1. Create a branch with a descriptive name
2. Make your changes with appropriate tests
3. Ensure all tests pass
4. Submit a pull request with a detailed description
5. Address any review comments

### Development Workflow

1. Feature branches should be created from `develop`
2. Pull requests merge into `develop`
3. Release branches created from `develop` when ready
4. Release branches merge into `main` and back into `develop`

---

© 2025 NDISuite. All rights reserved.
