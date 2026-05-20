# Financial RAG

A local financial document chat app for asking questions over PDF reports, filings, and statements.

The app lets you upload PDFs, indexes them into Qdrant with local embeddings, and then answers questions with a retrieval pipeline that combines vector search, keyword search, reranking, conversation memory, and streamed LLM responses.

## What is inside

- `client/` is the Next.js app. It contains the chat interface, PDF upload panel, document list, and source display.
- `server/` is the Express API. It handles PDF ingestion, chunking, embeddings, Qdrant indexing, chat memory, retrieval, and Groq-powered responses.
- `docker-compose.yml` starts Qdrant locally.
- `server/prisma/` stores the Prisma schema and migrations for chat history and uploaded document records.

## Main Features

- Upload financial PDFs from the browser.
- Extract and chunk report text before storing it.
- Generate embeddings with `Xenova/bge-small-en-v1.5`.
- Store vectors in a local Qdrant collection called `financial_docs`.
- Ask follow-up questions with chat memory.
- Stream answers back to the UI.
- Return the retrieved source chunks with each answer.

## Tech Stack

**Frontend**

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand
- Axios

**Backend**

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Qdrant
- Groq SDK
- LangChain text utilities
- Xenova Transformers

## Local Setup

You will need:

- Node.js
- npm
- Docker
- PostgreSQL
- A Groq API key

### 1. Install dependencies

From the project root:

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Start Qdrant

From the project root:

```bash
docker compose up -d
```

Qdrant will be available at:

```text
http://localhost:6333
```

The server creates the `financial_docs` collection automatically when it starts.

### 3. Configure the server

Create `server/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/financial_rag"
GROQ_API_KEY="your_groq_api_key"
PORT=8000
```

Use your own PostgreSQL username, password, and database name.

### 4. Prepare the database

From `server/`:

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Run the backend

From `server/`:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:8000
```

### 6. Run the frontend

From `client/`:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## How to Use

1. Start Qdrant, the backend, and the frontend.
2. Open the app in the browser.
3. Upload a financial PDF.
4. Wait for the document to finish indexing.
5. Start asking questions about the uploaded material.

Good first questions are things like:

```text
What were the main revenue drivers?
```

```text
Summarize the key risks mentioned in the report.
```

```text
How did operating margin change compared with the previous period?
```

## API Overview

The frontend currently talks to the backend at `http://localhost:8000/api`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/ingestion/upload` | Upload and index a PDF |
| `POST` | `/api/retrieval/chat` | Ask a question and stream an answer |
| `POST` | `/api/memory/create` | Create a new chat |
| `GET` | `/api/memory/chats` | List chats |
| `GET` | `/api/memory/chat/:chatId` | Load messages for a chat |
| `GET` | `/api/documents` | List indexed documents |
| `DELETE` | `/api/documents/:id` | Delete a document record |
| `GET` | `/api/qdrant/*` | Qdrant-related routes |

## Project Notes

- The first PDF upload can take a little longer because the embedding model may need to load.
- The client API URL is currently set in `client/services/api/api.ts`.
- The Qdrant URL is currently set in `server/src/modules/qdrant/qdrant.client.ts`.
- Only Qdrant is included in Docker Compose right now. PostgreSQL needs to be running separately.
- Uploaded PDFs are processed and then removed from local temporary storage after indexing.

## Useful Commands

Backend:

```bash
cd server
npm run dev
npm run build
npm start
```

Frontend:

```bash
cd client
npm run dev
npm run build
npm run lint
```

Infrastructure:

```bash
docker compose up -d
docker compose down
```

## Current Shape of the Retrieval Flow

At a high level, a chat request goes through this path:

```text
user question
-> recent chat history
-> query rewrite
-> vector search + keyword search
-> score boosting
-> deduplication
-> reranking
-> parent context expansion
-> source formatting
-> Groq streaming response
```

That flow lives mostly under `server/src/modules/retrieval/`, with chunking and embedding helpers in `server/src/services/`.

