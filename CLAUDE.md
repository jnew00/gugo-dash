# CLAUDE.md - GUGO Dash Context

## Project Overview
GUGO Dash is a personal productivity tool for managing Twitter/X engagement with AI assistance. It embodies the GUGO brand aesthetic - bold, athletic, and powerful. Single user application with no authentication needed beyond X OAuth.

## Brand Identity & Design Philosophy

### GUGO Design Language
- **Core Values**: Speed, Power, Precision
- **Visual Identity**: Neo-brutalist, high contrast, athletic energy
- **Color Philosophy**: 
  - Black = Strength and foundation
  - Green (#39FF14) = Energy and action
  - White = Clarity and space
- **Typography Hierarchy**:
  - Headers: Bold, condensed, uppercase
  - Body: Clean, readable, purposeful
  - CTAs: Heavy weight, commanding presence

### UI Principles
1. **Brutalist First**: Every element should feel intentional and powerful
2. **No Decoration**: Functionality over ornamentation
3. **High Contrast**: Clear visual hierarchy through contrast
4. **Athletic Energy**: Interfaces should feel fast and responsive
5. **Geometric Precision**: Sharp edges, defined spaces, grid-based layouts

## Technical Design Decisions

### Stack Selection Rationale
- **Next.js 14**: Full-stack framework, built-in API routes, optimized production builds
- **PostgreSQL**: Production-ready, scales better than SQLite, native JSON support
- **Prisma ORM**: Type-safe database access, automatic migrations, excellent DX
- **Docker + Unraid**: Self-hosted control, easy deployment, resource efficiency
- **Node.js Runtime**: Native Discord.js support, unified JavaScript stack

### Why Multiple AI Providers?
- **Cost Optimization**: Daily use demands economy
- **DeepSeek**: Extreme value for text generation
- **Together.ai**: 10-20x cheaper than alternatives for images
- **Flexibility**: Easy switching based on quality/cost needs

### Composite Image Approach
- **Brand Consistency**: Base images maintain GUGO visual identity
- **Contextual Relevance**: AI adds tweet-specific elements
- **Strength Control**: 0.4-0.6 preserves base while adding context
- **Speed Priority**: Quick generation over perfect quality

### Architecture Choices
- **Next.js API Routes**: Eliminates need for separate backend
- **Server Components**: Reduced client bundle, better SEO
- **PostgreSQL + Prisma**: Type safety, migrations, better scaling
- **Docker Deployment**: Consistent environment, easy Unraid integration
- **Background Jobs**: node-cron for Discord monitoring within Node.js

## Cost Targets
Daily usage (10 tweets):
- Text generation: <$0.01
- Image generation: $0.01-0.20 depending on provider
- Monthly target: <$5 total
- Philosophy: Efficient like GUGO runners

## Development Philosophy
- **Start Fast**: MVP first, enhance iteratively
- **Stay Lean**: No unnecessary complexity
- **Be Bold**: Make decisive design choices
- **Keep Flexible**: Configuration over hard-coding
- **Run Light**: Minimal dependencies

## Component Guidelines

### Tweet Cards
- Must feel substantial (thick borders)
- Clear status indication through color
- Hover effects should be snappy (0.2s max)
- Text hierarchy: Author > Content > Metadata

### Reply Composer
- Modal should dominate the screen when open
- Green accent for primary actions only
- Generous spacing for readability
- AI suggestions clearly differentiated

### Image Gallery
- Grid must be perfectly aligned
- Selection state must be obvious (green border)
- Thumbnails should load instantly
- Drag-drop upload with clear drop zone

## Unraid Deployment Strategy

### Container Configuration
```yaml
# Unraid Docker Template Settings
Name: GUGO Reply Hub
Repository: gugo-reply-hub:latest
Network Type: Bridge (or Custom Bridge)
WebUI: http://[IP]:[PORT:3000]
```

### Volume Mappings
- `/mnt/user/appdata/gugo/storage` → `/app/storage` (base & generated images)
- `/mnt/user/appdata/gugo/config/.env` → `/app/.env` (configuration)

### Database Options
1. **PostgreSQL in same container** (development)
2. **Separate PostgreSQL container** (recommended)
3. **Existing Unraid PostgreSQL** (if available)

### Resource Allocation
- **RAM**: 2GB minimum, 4GB recommended
- **CPU**: 2 cores minimum for image generation
- **Storage**: 10GB for images and database

### Backup Strategy
- Daily backup of PostgreSQL database
- Weekly backup of base_images directory
- Config file versioning in Git

## Next.js Specific Considerations

### API Route Organization
```typescript
// Centralized AI provider configuration
// lib/ai-providers/index.ts
export const getTextProvider = () => {
  switch(process.env.TEXT_PROVIDER) {
    case 'deepseek': return new DeepSeekProvider()
    case 'openai': return new OpenAIProvider()
  }
}

// Consistent error handling
// lib/api-response.ts
export const apiResponse = (data, status = 200) => {
  return NextResponse.json(data, { status })
}
```

### Database Connection Management
```typescript
// lib/prisma.ts
// Singleton pattern for Prisma in development
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### Background Jobs Architecture
```typescript
// lib/discord-bot.ts
// Runs as separate process in Docker container
import cron from 'node-cron'

cron.schedule('*/5 * * * *', async () => {
  await checkDiscordChannels()
  await updateTweetDatabase()
})
```

## Code Standards

### CSS Architecture
```css
/* Use CSS custom properties for theme */
:root {
  --gugo-black: #000000;
  --gugo-green: #39FF14;
  --gugo-white: #ffffff;
  --border-brutal: 3px solid var(--gugo-black);
  --shadow-brutal: 4px 4px 0 var(--gugo-green);
}
```

### Component Naming
- Prefix all custom components with `Gugo`
- Use descriptive, action-oriented names
- Example: `GugoTweetCard`, `GugoReplyButton`, `GugoImageSelector`

### State Management
- Keep it simple - React state for UI
- Local storage for preferences
- No Redux unless absolutely necessary

## Performance Targets
- Dashboard load: <1 second
- Tweet fetch: <500ms
- AI reply generation: <3 seconds
- Image generation: <10 seconds
- UI interactions: <100ms response

## Error Handling
- Bold error messages with black background
- Clear recovery actions in green
- Never fail silently
- Log everything for debugging

## Accessibility Notes
While maintaining GUGO aesthetic:
- Ensure AA contrast ratios
- Keyboard navigation for all features
- Screen reader friendly despite brutal design
- Focus indicators in green

## The GUGO Way
Every decision should ask:
1. Is it fast?
2. Is it bold?
3. Is it necessary?
4. Does it help the user GO?

Remember: GUGO Reply Hub isn't just a tool - it's a statement. Make it powerful, make it fast, make it GUGO.