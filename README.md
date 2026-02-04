# Tree Removal Services - AI Receptionist

AI-powered phone receptionist SaaS for tree removal businesses. **WIP**

## Prerequisites

- Node.js 20+
- pnpm 10+
- [Clerk](https://clerk.com) account
- [Convex](https://convex.dev) account
- [ElevenLabs](https://elevenlabs.io) account (for voice agent)
- [OpenAI](https://platform.openai.com) API key (for lead extraction + onboarding scrape)
- [Stripe](https://stripe.com) account (for subscriptions)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure Clerk

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Go to Configure > JWT Templates > create one named **"convex"** (do NOT rename)
3. Copy the Issuer URL from the JWT template

### 3. Configure Convex

```bash
npx convex dev
```

This prompts you to log in and create a project. Then set `CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard environment variables (use the Issuer URL from step 2).

### 4. Set up web app environment

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - from Clerk dashboard
- `CLERK_SECRET_KEY` - from Clerk dashboard
- `NEXT_PUBLIC_CONVEX_URL` - from Convex dashboard (shown after `npx convex dev`)
- `ELEVENLABS_API_KEY` - from [ElevenLabs](https://elevenlabs.io) dashboard > Profile + API key
- `OPENAI_API_KEY` - from [OpenAI](https://platform.openai.com) dashboard
- `STRIPE_SECRET_KEY` - from Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` - from Stripe webhook settings
- `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_STARTER_YEARLY`, `STRIPE_PRICE_PRO_MONTHLY`,
  `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_GROWTH_YEARLY`
- `BILLING_WEBHOOK_SECRET` - any random secret shared with Convex webhook mutation

### 5. Run development

```bash
pnpm dev          # Runs web + Convex dev server in parallel
```

## ElevenLabs Voice Agent Setup

1. Get an API key from [elevenlabs.io](https://elevenlabs.io) > Profile + API key
2. Add it to `apps/web/.env.local` as `ELEVENLABS_API_KEY`
3. Start the app and go to Dashboard > Agent Settings
4. Click **"Save & Connect to ElevenLabs"** to create the agent
5. Once connected, click **"Open Voice Lab"** or navigate to `/chat/<agentId>`
6. Click **"Start Voice Chat"** to begin a conversation (requires microphone access)

The voice lab lets you:
- Talk to your AI receptionist in real-time via your browser microphone
- See a live transcript of the conversation
- View automatically extracted lead fields (name, phone, address, urgency, etc.)
- Review memory facts captured during the conversation

## Project Structure

```
apps/web/       Next.js dashboard (Clerk + Convex + ElevenLabs + Stripe)
convex/         Convex backend (schema, mutations, queries)
packages/       Shared packages (future)
```

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page |
| `/get-started` | Onboarding (website → agent → profile) |
| `/pricing` | Pricing + trial checkout |
| `/dashboard` | Main dashboard with agent status |
| `/dashboard/agents` | Agent list / grid |
| `/dashboard/agents/new` | Create new agent |
| `/dashboard/agents/[agentId]/settings` | Agent configuration + ElevenLabs sync |
| `/dashboard/leads` | Lead list |
| `/dashboard/calls` | Call history |
| `/chat/[agentId]` | Voice chat lab for testing the agent |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run web + Convex dev server |
| `pnpm dev:web` | Run only Next.js |
| `pnpm dev:convex` | Run only Convex dev |
| `pnpm build` | Build web app |
| `pnpm start` | Start web app (production) |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |

## Deployment Notes

1. Set production env vars in your hosting platform (Clerk, Convex, Stripe, OpenAI, ElevenLabs).
2. In Stripe → Developers → Webhooks, add an endpoint for:
   - `https://<your-domain>/api/stripe/webhook`
3. In Convex → Settings → Environment Variables, set:
   - `CLERK_JWT_ISSUER_DOMAIN`
4. Deploy Convex:
   ```bash
   npx convex deploy
   ```
5. Deploy the Next.js app (Vercel, Render, etc.). Ensure `NEXT_PUBLIC_CONVEX_URL` points to the deployed Convex URL.
