# Document Q&A with RAG

A document question-answering application that uses Retrieval-Augmented
Generation (RAG) to provide accurate answers based on uploaded documents.

## Features

- 📄 Upload PDF and TXT documents
- 💬 Ask questions about uploaded documents
- 🔍 Get AI-powered answers with relevant source passages
- 🎨 Modern and responsive UI with animations
- 🗄️ Vector similarity search for accurate retrieval
- 🚀 Real-time chat interface with source highlighting

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Django, REST Framework
- **Database**: PostgreSQL with pgvector extension
- **AI**: OpenAI API (GPT-3.5/4 and text-embedding-ada-002)
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose
- OpenAI API Key

## Setup

1. Clone the repository:

```bash
git clone git@github.com:jorgearuv/rag-qa.git
cd rag-qa
```

2. Copy the example environment file:

```bash
cp .env.example .env
```

3. Edit the `.env` file and add your OpenAI API key

4. Start the application:

```bash
docker compose up --build
```

5. Access the application:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development

### Project Structure

```
.
├── backend/                 # Django backend
│   ├── api/                # Django application
│   │   ├── migrations/     # Database migrations
│   │   ├── __init__.py
│   │   ├── admin.py       # Admin interface
│   │   ├── apps.py        # App configuration
│   │   ├── models.py      # Database models
│   │   ├── serializers.py # API serializers
│   │   ├── tests.py       # Unit tests
│   │   ├── utils.py       # Helper functions
│   │   └── views.py       # API endpoints
│   ├── ragqa/             # Project settings
│   │   ├── __init__.py
│   │   ├── settings.py    # Django settings
│   │   ├── urls.py        # URL routing
│   │   └── wsgi.py        # WSGI config
│   ├── Dockerfile         # Backend container config
│   ├── manage.py          # Django CLI
│   ├── requirements.txt   # Python dependencies
│   └── start.sh          # Container startup script
├── frontend/              # React frontend
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   │   ├── ChatInterface.tsx
│   │   │   └── DocumentList.tsx
│   │   ├── constants/    # Configuration
│   │   │   └── config.ts
│   │   ├── lib/         # Utilities
│   │   │   └── utils.ts
│   │   ├── App.tsx      # Main app component
│   │   ├── index.css    # Global styles
│   │   ├── main.tsx     # Entry point
│   │   └── vite-env.d.ts # TypeScript declarations
│   ├── Dockerfile        # Frontend container config
│   ├── index.html        # HTML template
│   ├── package.json      # Node.js dependencies
│   ├── postcss.config.js # PostCSS config
│   ├── tailwind.config.js # Tailwind CSS config
│   ├── tsconfig.json     # TypeScript config
│   ├── tsconfig.app.json # App TS config
│   └── tsconfig.node.json # Node TS config
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore rules
├── docker-compose.yml    # Container orchestration
└── README.md            # Project documentation
```

- Backend code is in the `backend/` directory

  - Django REST API endpoints in `api/views.py`
  - Database models in `api/models.py`
  - Document processing in `api/utils.py`

- Database
  - PostgreSQL with pgvector extension for similarity search
  - Automatic initialization and migrations on startup
  - Data persisted in Docker volume `postgres_data`

### API Documentation

API documentation is available via Django REST Swagger at
http://localhost:8000/api/docs/

## License

MIT
