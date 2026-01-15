# 🤖 The Discord Copilot (Admin-Controlled Agent)

A lightweight environment for orchestrating an AI-powered Discord Bot via a premium Admin Web Console.

## Goal
The Discord Copilot bridge the gap between AI rules and user interaction. It allows an Administrator to define "System Instructions" (the brain) and manage domain-specific knowledge (RAG) through a web dashboard, while a team interacts with that refined agent seamlessly on Discord.

---

## Core Pillars

### 1. Admin Web Console (The Architect)
Built with **Next.js 16** and **Vanilla CSS** for a premium, high-performance experience.
- **System Instructions**: Define personality, tone, and behavioral logic.
- **Discord Allow-list**: Granular control over which channels the bot can respond in.
- **Memory Control**: View and reset rolling conversation summaries per channel.
- **Knowledge Base (RAG)**: Upload PDF documents that are chunked and stored as embeddings for domain-specific intelligence.

### 2. The Discord Bot (The Executive)
A **Node.js** long-running service designed for reliability.
- **Context Awareness**: Assembles responses using Admin instructions, recent conversation summary, and relevant RAG snippets.
- **Strict Interaction**: Responds to all messages in allow-listed channels; responds only to @mentions in other channels.
- **Robustness**: Handles long messages by splitting them automatically to fit Discord's limits.

### 3. Unified Backend (The Core)
Powered by **Supabase**.
- Shared database for settings and memory.
- **pgvector** storage for RAG embeddings.
- Row Level Security (RLS) to protect private configurations.

---

## 🛠 Tech Stack
- **Web App**: Next.js 16, React 19, Vanilla CSS.
- **Bot**: Node.js, Discord.js.
- **Database**: Supabase (PostgreSQL + pgvector).
- **AI**: Gemini (via API).
- **Hosting**: Vercel (Admin) & Railway (Bot).

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account
- Discord Developer Application

### Environment Setup
Create a `.env` file in both `admin-console/` and `discord-bot/` folders using the provided `env.example` templates.

### Running Locally
```bash
# 1. Start the Admin Console
cd admin-console
npm install
npm run dev

# 2. Start the Discord Bot
cd discord-bot
npm install
npm start
```

---

## 📄 License
MIT

---

