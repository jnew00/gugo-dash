# INITIAL_PROMPT.md - GUGO Dash

I need you to build a personal productivity tool called **GUGO Dash** for managing Twitter/X engagement. This is a single-user application (no auth needed) that aggregates tweets from various sources into a dashboard where I can generate AI-powered replies with custom composite images.

## UI Design Requirements

The UI must follow the design aesthetic of runwithgugo.com:
- **Color Palette**: Black (#000000), bright green (#00FF00 or #39FF14), and white (#FFFFFF)
- **Typography**: Bold, condensed sans-serif headers (like Bebas Neue or similar), clean body text
- **Layout**: Minimal, high contrast, lots of black space
- **Components**: 
  - Thick black borders/outlines
  - Green accent highlights and CTAs
  - Brutalist/neo-brutalist design elements
  - Sharp corners, no excessive rounding
  - Bold geometric shapes
  - High contrast between elements
- **Animations**: Subtle hover effects with green highlights
- **Overall Vibe**: Modern, bold, athletic, high-energy

## Project Requirements

### Core Functionality
1. **Tweet Aggregation Dashboard**
   - Manual URL input for tweets
   - Discord bot that periodically checks specified channels for Twitter/X URLs
   - Simple hashtag monitoring on X
   - Display tweets in cards with thick black borders
   - Status indicators using green/white/black color coding (new/replied/skipped)
   - Brutalist card design with sharp edges

2. **AI-Powered Reply System**
   - Click any tweet to open reply composer (modal with thick black border)
   - Generate 2-3 AI reply suggestions using configurable LLM (DeepSeek or OpenAI)
   - Full editing capability in a bold, clean text area
   - Green "GENERATE" and "POST" buttons with black text
   - Direct post to X via OAuth (no scheduling needed)

3. **Composite Image Generation**
   - Upload and manage base images (displayed in geometric grid)
   - Select base image with green highlight border on selection
   - Generate composite image that maintains base image character/style while adding tweet-relevant context
   - Preview in stark black frame with green accent
   - "REGENERATE" button in signature green
   - Support multiple image generation backends

### Visual Components Specification

#### Header
```css
- Black background
- Logo: "GUGO REPLY HUB" in bold, condensed font
- Green accent line underneath
- Minimal navigation with white text
```

#### Tweet Cards
```css
- White background
- 3-4px solid black border
- Author name in bold black
- Tweet text in clean sans-serif
- Green highlight for interaction buttons
- Status badge: green (new), white (replied), black (skipped)
```

#### Reply Composer Modal
```css
- Overlay with semi-transparent black background
- Modal with thick black border (4-5px)
- White background
- Green header bar with "COMPOSE REPLY" text
- Black text on white for content
- Green CTA buttons with black text
```

#### Base Image Gallery
```css
- Grid layout with black dividers
- Images in square frames with black borders
- Green highlight on hover
- Selected image gets thick green border
```

### Technical Specifications

#### Stack Overview
- **Framework**: Next.js 14 with App Router
- **Frontend**: React 18 with TypeScript
- **Backend**: Next.js API routes with Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS with custom design system
- **Container**: Docker for Unraid deployment

#### Frontend (Next.js + React)
- Next.js 14 App Router for file-based routing
- React Server Components where applicable
- Client components for interactive elements
- Custom CSS with Tailwind + CSS modules for GUGO theme
- NO rounded corners except for critical UX elements
- Font stack: 'Bebas Neue', 'Anton', 'Oswald', sans-serif for headers
- Body font: 'Inter', 'Helvetica', sans-serif
- Animations: Framer Motion for smooth transitions
- Mobile responsive with same aesthetic
- Image optimization with next/image

#### Backend (Node.js + Next.js API Routes)
- API Routes in /app/api directory
- Node.js runtime for Discord bot integration
- Background jobs with node-cron for periodic checks
- Multer for image upload handling
- Authentication with NextAuth.js for X OAuth
- Rate limiting with express-rate-limit

#### Database (PostgreSQL + Prisma)
```prisma
// schema.prisma
model Tweet {
  id         String   @id @default(cuid())
  tweetUrl   String   @unique
  tweetText  String
  tweetId    String   @unique
  author     String
  source     Source
  status     Status   @default(NEW)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  replies    Reply[]
}

model BaseImage {
  id          String   @id @default(cuid())
  filename    String
  path        String
  description String?
  uploadedAt  DateTime @default(now())
  replies     Reply[]
}

model Reply {
  id           String    @id @default(cuid())
  tweetId      String
  tweet        Tweet     @relation(fields: [tweetId], references: [id])
  replyText    String
  imageId      String?
  baseImage    BaseImage? @relation(fields: [imageId], references: [id])
  imagePath    String?
  postedAt     DateTime?
  createdAt    DateTime  @default(now())
}

enum Source {
  DISCORD
  MANUAL
  HASHTAG
}

enum Status {
  NEW
  REPLIED
  SKIPPED
}
```

#### Environment Configuration
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/gugo_reply_hub"

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI Providers
TEXT_PROVIDER=deepseek  # or openai
IMAGE_PROVIDER=together  # or replicate, comfyui, openai
DEEPSEEK_API_KEY=...
OPENAI_API_KEY=...
TOGETHER_API_KEY=...
REPLICATE_API_KEY=...
COMFYUI_ENDPOINT=http://localhost:8188

# Twitter/X OAuth
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Discord Bot
DISCORD_BOT_TOKEN=...
DISCORD_CHANNEL_IDS=123456789,987654321
CHECK_INTERVAL_MINUTES=5

# Storage
UPLOAD_DIR=/app/storage
```

### Configuration Requirements

Create a flexible configuration system that supports multiple AI providers:

#### Text Generation Providers
1. **DeepSeek** (Recommended - cheapest)
   - API endpoint: https://api.deepseek.com/v1/chat/completions
   - Model: deepseek-chat
   - Cost: ~$0.14/million tokens

2. **OpenAI** (Fallback option)
   - Model: gpt-4o-mini
   - Cost: ~$0.15/million tokens

#### Image Generation Providers
1. **Together.ai** (Cheapest - ~$0.001/image)
   - Model: stabilityai/stable-diffusion-xl-base-1.0
   - Supports img2img for compositing

2. **Replicate** (~$0.01-0.02/image)
   - Model: stability-ai/sdxl with img2img
   - Good balance of cost/quality

3. **ComfyUI Local** (Free but requires GPU)
   - SDXL model running locally
   - API endpoint configurable
   - ControlNet support for better compositing

4. **OpenAI DALL-E** (Most expensive - ~$0.04-0.08/image)
   - As fallback option only

Configuration should be environment-based (.env file):
```env
TEXT_PROVIDER=deepseek  # or openai
IMAGE_PROVIDER=together  # or replicate, comfyui, openai

DEEPSEEK_API_KEY=...
OPENAI_API_KEY=...
TOGETHER_API_KEY=...
REPLICATE_API_KEY=...
COMFYUI_ENDPOINT=http://localhost:8188

TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
DISCORD_BOT_TOKEN=...
DISCORD_CHANNEL_IDS=123456789,987654321
CHECK_INTERVAL_MINUTES=5
```

### Image Compositing Strategy
- Use img2img with strength 0.4-0.6 to maintain base image identity
- Prompt template: "maintain main subject from image, add [extracted context from tweet], high quality composite, [style descriptors]"
- Negative prompt: "blurry, distorted, disfigured, text, watermark"
- Allow strength adjustment in UI with green slider

### Discord Integration
- Periodic checks every 5 minutes (configurable)
- Extract Twitter/X URLs from messages
- Store channel IDs in config
- Only fetch tweet content from X API, not Discord context

### UI Component Examples

#### Main Dashboard Layout
```jsx
<div className="gugo-container">
  <header className="gugo-header">
    <h1 className="gugo-logo">GUGO REPLY HUB</h1>
    <div className="green-accent-line"></div>
  </header>
  
  <main className="gugo-main">
    <div className="tweet-grid">
      {/* Tweet cards with brutal borders */}
    </div>
  </main>
  
  <button className="gugo-fab">
    + ADD TWEET
  </button>
</div>
```

#### Styling Approach
```css
/* Core styles to implement */
.gugo-container {
  background: #ffffff;
  color: #000000;
  font-family: 'Inter', sans-serif;
}

.gugo-header {
  background: #000000;
  color: #ffffff;
  padding: 2rem;
  border-bottom: 4px solid #39FF14;
}

.gugo-logo {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 3rem;
  letter-spacing: 0.05em;
}

.tweet-card {
  background: #ffffff;
  border: 3px solid #000000;
  padding: 1.5rem;
  transition: transform 0.2s ease;
}

.tweet-card:hover {
  transform: translateY(-2px);
  box-shadow: 4px 4px 0 #39FF14;
}

.gugo-button {
  background: #39FF14;
  color: #000000;
  border: 3px solid #000000;
  font-weight: 900;
  text-transform: uppercase;
  padding: 1rem 2rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gugo-button:hover {
  background: #000000;
  color: #39FF14;
}
```

### Development Priorities
1. Next.js app setup with PostgreSQL connection
2. X OAuth implementation with NextAuth.js
3. Core dashboard with GUGO styling
4. Tweet CRUD operations with Prisma
5. DeepSeek integration for reply suggestions
6. Base image upload and management
7. Together.ai image generation integration
8. Discord bot as separate Node.js process
9. Docker containerization for Unraid
10. Production optimizations and testing

### API Routes Structure
```typescript
// app/api/tweets/route.ts
GET    /api/tweets          // Fetch all tweets
POST   /api/tweets          // Add new tweet
PATCH  /api/tweets/[id]     // Update tweet status
DELETE /api/tweets/[id]     // Remove tweet

// app/api/replies/route.ts
POST   /api/replies/generate    // Generate AI reply suggestions
POST   /api/replies/post        // Post reply to X

// app/api/images/route.ts
POST   /api/images/upload       // Upload base image
GET    /api/images              // List base images
POST   /api/images/generate     // Generate composite image

// app/api/discord/route.ts
POST   /api/discord/check       // Manual trigger for Discord check
GET    /api/discord/status      // Get bot status
```

### Key Next.js Configuration
```javascript
// next.config.js
module.exports = {
  output: 'standalone', // For Docker deployment
  images: {
    domains: ['pbs.twimg.com', 'localhost'],
    unoptimized: true, // For self-hosted
  },
  experimental: {
    serverActions: true,
  },
}
```

### Package.json Dependencies
```json
{
  "dependencies": {
    "@prisma/client": "^5.x",
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "next-auth": "^4.x",
    "framer-motion": "^11.x",
    "tailwindcss": "^3.x",
    "twitter-api-v2": "^1.x",
    "discord.js": "^14.x",
    "node-cron": "^3.x",
    "multer": "^1.x",
    "sharp": "^0.33.x",
    "openai": "^4.x",
    "replicate": "^0.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "typescript": "^5.x",
    "prisma": "^5.x",
    "eslint": "^8.x",
    "eslint-config-next": "^14.x"
  }
}
```

### File Structure
```
gugo-reply-hub/
├── app/
│   ├── api/
│   │   ├── tweets/
│   │   │   └── route.ts
│   │   ├── replies/
│   │   │   └── route.ts
│   │   ├── images/
│   │   │   ├── generate/route.ts
│   │   │   └── upload/route.ts
│   │   └── auth/
│   │       └── [...nextauth]/route.ts
│   ├── dashboard/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── TweetCard.tsx
│   ├── ReplyComposer.tsx
│   ├── ImageGallery.tsx
│   ├── GugoButton.tsx
│   └── GugoHeader.tsx
├── lib/
│   ├── prisma.ts
│   ├── discord-bot.ts
│   ├── twitter-client.ts
│   ├── ai-providers/
│   │   ├── deepseek.ts
│   │   ├── openai.ts
│   │   ├── together.ts
│   │   ├── replicate.ts
│   │   └── comfyui.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── fonts/
├── storage/
│   ├── base_images/
│   └── generated_images/
├── styles/
│   └── gugo-theme.css
├── .env.local
├── .env.production
├── docker-compose.yml
├── Dockerfile
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

### Docker Configuration for Unraid

#### Dockerfile
```dockerfile
# Multi-stage build for optimal size
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production
RUN npm install -g prisma
RUN npx prisma generate

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create storage directories
RUN mkdir -p /app/storage/base_images /app/storage/generated_images
RUN chown -R nextjs:nodejs /app/storage

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

#### docker-compose.yml (for local development and Unraid)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: gugo-postgres
    environment:
      POSTGRES_USER: gugo
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: gugo_reply_hub
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  app:
    build: .
    container_name: gugo-reply-hub
    environment:
      DATABASE_URL: postgresql://gugo:${DB_PASSWORD}@postgres:5432/gugo_reply_hub
      NEXT_PUBLIC_APP_URL: ${APP_URL}
      # Add all other env vars from .env
    volumes:
      - ./storage:/app/storage
      - ./.env.production:/app/.env
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Unraid Deployment Instructions
```markdown
## Unraid Deployment

1. **Create app directory in Unraid:**
   ```bash
   mkdir -p /mnt/user/appdata/gugo-reply-hub
   cd /mnt/user/appdata/gugo-reply-hub
   ```

2. **Copy files to Unraid:**
   - Upload all project files to the directory
   - Ensure .env.production is configured

3. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Alternative: Unraid Docker Template**
   Create a new Docker template in Unraid with:
   - Repository: gugo-reply-hub:latest (after building)
   - Network Type: Bridge
   - Port Mappings: 3000:3000
   - Volume Mappings:
     - /mnt/user/appdata/gugo-reply-hub/storage:/app/storage
     - /mnt/user/appdata/gugo-reply-hub/.env:/app/.env
   - Environment Variables: Add all from .env file

5. **Access the app:**
   Navigate to http://[UNRAID_IP]:3000
```

## Implementation Notes

1. **Every UI element** should follow the GUGO aesthetic - bold, black, green, geometric
2. **No gradients** - solid colors only
3. **Typography is crucial** - use bold, condensed fonts for impact
4. **Interactions** should feel snappy and athletic
5. **Green (#39FF14)** should be used sparingly but effectively for CTAs and highlights
6. **White space** is important but should be balanced with bold black elements
7. **Icons** should be minimal, geometric, and only black or green

Build this application with the GUGO brand identity at its core. The tool should feel powerful, fast, and bold - like the GUGO running brand itself.