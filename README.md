# 🦆 GUGO Dash

**Personal productivity tool for managing Twitter/X engagement with AI assistance**

![GUGO Brand](https://img.shields.io/badge/GUGO-Dash-DAA520?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzhCNDUxMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg0IjE2IiBoZWlnaHQ9IjE2IiBzdHJva2U9IiNEQUE1MjAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIgcng9IjMiLz4KPHN2Zz4K&logoColor=8B4513)
![Next.js](https://img.shields.io/badge/Next.js-14-8B4513?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-DAA520?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-87A96B?style=flat-square&logo=postgresql)

## 🏃‍♂️ Born in a pool. Forged by loss. Sustained by motion.

**We $GUGO.**

GUGO Dash channels the adventure spirit of the GUGO movement. It's a single-user productivity tool that aggregates tweets from various sources into an adventure-themed dashboard where you can generate AI-powered replies with custom composite images.

### 🎯 Core Features

- **Tweet Aggregation**: Manual URL input, Discord bot monitoring, hashtag tracking
- **AI-Powered Replies**: Generate contextual responses using DeepSeek or OpenAI
- **Composite Image Generation**: Create custom visuals using Together.ai or Replicate
- **Adventure UI**: Warm desert theme following GUGO brand principles
- **Single-User Focus**: No authentication needed beyond X OAuth
- **Cost-Optimized**: Daily usage under $5/month

### 🏃‍♂️ GUGO Design Philosophy

Every pixel follows the adventure spirit:
- **Desert Brown (#8B4513)**: Strength and foundation
- **Golden Glow (#DAA520)**: Energy and achievement
- **Desert Cream (#F5E6D3)**: Clarity and warmth
- **Adventure First**: Engaging, inviting interfaces
- **Athletic Energy**: Fast, responsive interactions
- **Community Focused**: We run together

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** with custom GUGO adventure design system
- **Lucide React** for clean, bold icons

### Backend
- **Next.js API Routes** (unified full-stack)
- **PostgreSQL** with Prisma ORM
- **Node.js** runtime for Discord integration

### AI Providers
- **DeepSeek** (text generation, ~$0.14/M tokens)
- **Together.ai** (image generation, ~$0.001/image)
- **OpenAI** (fallback option)
- **Replicate** (alternative image provider)

#### Meme Matching & Local LLMs
- The meme picker respects the admin-selected provider (DeepSeek, OpenAI, or Local). When running locally (LM Studio/Ollama), make sure your server exposes `/v1/chat/completions` with a context window large enough to cover the prompt (see log output below).
- Every meme in the prompt includes its description and, if available, tags. Descriptions come from the vision analysis step (`POST /api/memes/analyze`), so run that endpoint to give the matcher rich context.
- The prompt builder prioritises the most relevant memes using a keyword/tone scorer. The top *N* (defaults to 80) keep full descriptions; the rest are summarized as `ID + tags` so the model can still see your whole collection without blowing up context.
- Tune the detailed block size with `MEME_MATCH_FULL_LIMIT` in `.env` (set lower to shrink prompts, higher to include more descriptions).
- Watch the server logs for:
  - `Meme match prompt stats` → shows detailed vs summary counts, character length, and an approximate token count (characters ÷ 4) so you can line up your local model’s context length.
  - `Meme match provider response` → dumps the raw model output for debugging.
  - `Supplementing meme recommendations…` → indicates we topped up fewer-than-three IDs with keyword-ranked memes to keep UX consistent.
- The reply generator also honours the admin text provider setting; the local path expects `/v1/chat/completions` first and falls back to `/api/generate` if needed.

### Infrastructure
- **Docker** containerization
- **Unraid** deployment target
- **Self-hosted** for complete control

## ⚙️ Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Discord bot (optional)
- AI provider API keys

### 1. Clone and Setup
```bash
git clone <repository-url>
cd GugoDash
chmod +x setup.sh
./setup.sh
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Database Setup
```bash
npm run db:push
```

### 4. Development
```bash
npm run dev
```

Visit `http://localhost:3000` to see the GUGO aesthetic in action.

### 5. Production (Docker)
```bash
docker-compose up -d
```

## 📦 Environment Variables

### Required
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/gugo_reply_hub"
DEEPSEEK_API_KEY="your_deepseek_key"
TOGETHER_API_KEY="your_together_key"
```

### Optional
```env
TWITTER_CLIENT_ID="your_twitter_client"
TWITTER_CLIENT_SECRET="your_twitter_secret"
DISCORD_BOT_TOKEN="your_discord_token"
DISCORD_CHANNEL_IDS="123456789,987654321"
MEME_MATCH_FULL_LIMIT=80        # Number of memes that keep full descriptions in the matching prompt
```

See `.env.example` for all options.

## 🎨 UI Components

All components follow the GUGO design system:

- **GugoButton**: Bold, high-contrast CTAs
- **TweetCard**: Brutal borders, clear hierarchy
- **ReplyComposer**: Full-screen modal dominance
- **ImageGallery**: Geometric grid layouts

## 🔧 API Endpoints

### Tweets
- `GET /api/tweets` - List all tweets
- `POST /api/tweets` - Add new tweet
- `PATCH /api/tweets/[id]` - Update tweet status

### AI Generation
- `POST /api/replies/generate` - Generate reply suggestions
- `POST /api/images/generate` - Create composite images

### Discord Integration
- `POST /api/discord/check` - Manual sync
- `GET /api/discord/status` - Bot status

## 🎯 Cost Optimization

Daily usage (10 tweets):
- **Text generation**: <$0.01 (DeepSeek)
- **Image generation**: $0.01-0.20 (Together.ai)
- **Monthly target**: <$5 total

Just like GUGO runners - efficient and powerful.

## 🐳 Docker Deployment

### Option 1: Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Option 2: Unraid Template
Upload to Unraid and use the provided Docker template configuration.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Unraid instructions.

## 📊 Project Structure

```
gugo-reply-hub/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard
│   └── globals.css        # GUGO design system
├── components/            # React components
│   ├── GugoButton.tsx
│   ├── TweetCard.tsx
│   └── ReplyComposer.tsx
├── lib/                   # Utilities & integrations
│   ├── ai-providers/      # AI service integrations
│   ├── discord-bot.ts     # Discord monitoring
│   └── prisma.ts          # Database client
├── prisma/                # Database schema
├── storage/               # File uploads
└── docker-compose.yml     # Deployment config
```

## 🔐 Security Features

- Secure API key management
- File upload validation
- Database input sanitization
- Docker container isolation
- No authentication required (single-user)

## 📈 Performance Targets

- Dashboard load: <1 second
- Tweet fetch: <500ms
- AI reply generation: <3 seconds
- UI interactions: <100ms response

**Fast like GUGO.**

## 🤝 Contributing

This is a personal productivity tool, but PRs for bug fixes and performance improvements are welcome.

## 📄 License

ISC License - Built for personal productivity.

---

## 🏃‍♂️ The GUGO Way

Every decision asks:
1. **Is it fast?**
2. **Is it bold?**  
3. **Is it necessary?**
4. **Does it help the user GO?**

GUGO Reply Hub isn't just a tool - it's a statement. **Make it powerful, make it fast, make it GUGO.**
