# RAG-based Q&A Chatbot

A document analysis chatbot that uses RAG (Retrieval-Augmented Generation) to
answer questions based on uploaded documents.

## Features

- 📄 Upload and process PDF and TXT documents
- 💬 Chat interface for document-specific questions
- 🔍 Semantic search using OpenAI embeddings
- 🗄️ Vector similarity search with pgvector
- 🚀 Modern React frontend with real-time updates

## Prerequisites

- Docker and Docker Compose
- OpenAI API Key

## Quick Start

1. Clone the repository:

```bash
git clone <repository-url>
cd rag-qa
```

2. Create a `.env` file in the root directory:

```bash
OPENAI_API_KEY=your_api_key_here
DJANGO_SECRET_KEY=your_django_secret_key_here
```

3. Start the application:

```bash
docker compose up --build
```

The services will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Development

### Project Structure

```
.
├── backend/             # Django backend
│   ├── app/            # Django application
│   │   ├── api/        # REST API endpoints
│   │   ├── core/       # Core functionality
│   │   └── settings/   # Django settings
│   └── Dockerfile
├── frontend/           # React frontend
│   ├── src/           # Source code
│   └── Dockerfile
└── docker-compose.yml  # Docker services configuration
```

### Database Management

- The database is automatically initialized on first run
- Django migrations are applied automatically on startup
- To reset the database:

```bash
docker compose down
docker volume rm rag-qa_postgres_data
docker compose up --build
```

### API Documentation

API documentation is available via Django REST Swagger at
http://localhost:8000/api/docs/

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Django, Django REST Framework
- **Database**: PostgreSQL with pgvector
- **AI**: OpenAI API (embeddings and chat)
- **Infrastructure**: Docker, Docker Compose
