# theringreceiptionsit.com

AI receptionist SaaS for service businesses (plumbers, HVAC, electrical, movers, tree services).

## Current Status

### What works

- Marketing + service pages:
  - `/`
  - `/services/plumbers`
  - `/services/hvac`
  - `/services/electricians`
  - `/services/movers`
  - `/services/tree`
- Multi-step onboarding at `/get-started`:
  - Step 1: business website URL capture (demo mode)
  - Step 2: ElevenLabs voice selection with sample previews
  - Step 3: call coverage preferences (business hours / 24x7 / custom schedule)
  - Step 4: contact + auth + agent creation
  - Step 5 (redirect): pricing and trial activation
- Agent creation saves:
  - business + tone + custom context
  - selected voice ID
  - onboarding website URL
  - call handling preferences
- Pricing flow:
  - Starter / Pro / Growth plans
  - monthly / yearly toggle
  - testimonials section under pricing cards
- Stripe trial model implemented:
  - checkout subscription
  - 7-day trial
  - card required upfront
  - $0 due today
  - subscription starts after trial
- Billing routes in place:
  - `/api/stripe/checkout`
  - `/api/stripe/portal`
  - `/api/stripe/webhook`
  - `/api/stripe/sync-subscription`
- Dashboard app routes exist:
  - `/dashboard`
  - `/dashboard/agents`
  - `/dashboard/agents/[agentId]/settings`
  - `/dashboard/leads`
  - `/dashboard/calls`
  - `/dashboard/appointments`
  - `/dashboard/knowledge`
  - `/dashboard/billing`

### What does not work yet / known gaps

- Website scraping in onboarding is intentionally disabled right now (demo mode only).
- Onboarding stores URL and settings but does not auto-train from scraped pages yet.
- Voice previews in onboarding rely on ElevenLabs voice preview URLs; custom generated multi-sample previews are not yet part of onboarding.
- Twilio telephony integration is not active in this phase.
- Convex CLI may show `Found multiple CONVEX_URL environment variables` if your shell exports conflicting values.

## Stack

- Next.js 16 (App Router)
- React 19
- Convex
- Clerk
- ElevenLabs
- Stripe
- Tailwind CSS 4
- Framer Motion

## Local Development

### 1) Prerequisites

- Node.js 20+
- npm / pnpm / bun
- Convex account
- Clerk account
- ElevenLabs API key
- Stripe account + prices
- OpenAI API key (for extraction/summaries routes)

### 2) Environment setup (single source of truth)

Use one file at repo root:

- Keep: `/.env.local`
- Remove manual editing of: `/apps/web/.env.local`

`/apps/web/.env.local` is now synced from root via script.

Copy template:

```bash
cp .env.example .env.local
```

Required keys include:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CONVEX_DEPLOYMENT`
- `CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_URL`
- `ELEVENLABS_API_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_STARTER_YEARLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_GROWTH_MONTHLY`
- `STRIPE_PRICE_GROWTH_YEARLY`
- `BILLING_WEBHOOK_SECRET`

Important:

- `STRIPE_SECRET_KEY` must be an `sk_...` secret key.
- `STRIPE_WEBHOOK_SECRET` must be a `whsec_...` webhook signing secret.

Set `CLERK_JWT_ISSUER_DOMAIN` in Convex dashboard env (not local file).

### 3) Install dependencies

Any package manager is supported.

```bash
pnpm install
# or
npm install
# or
bun install
```

### 4) Generate Convex types

```bash
npx convex codegen
```

### 5) Run dev

```bash
pnpm dev
# or
npm run dev
# or
bun run dev
```

This runs:

- web app: `http://localhost:3002`
- Convex dev server

## Commands

All commands work with `pnpm`, `npm`, or `bun run`.

- `dev` - run web + Convex
- `dev:web` - run only Next.js app
- `dev:convex` - run only Convex
- `build` - production build (web)
- `start` - start production server
- `lint` - lint web app
- `typecheck` - type check web app
- `sync:env` - sync root `.env.local` to `apps/web/.env.local`

## Deployment (Vercel + Convex + Stripe)

### Vercel

- Root directory: repository root
- Build command: `pnpm --filter @vozexo/web build` or `npm run build`
- Install command: `pnpm install --frozen-lockfile` (default)
- Do not set Output Directory manually for this monorepo unless required.

### Convex

```bash
npx convex deploy
```

Set Convex env vars:

- `CLERK_JWT_ISSUER_DOMAIN`
- any backend secrets used by Convex functions

### Stripe

- Webhook endpoint:
  - local: `http://localhost:3002/api/stripe/webhook`
  - prod: `https://<your-domain>/api/stripe/webhook`
- Listen locally (Stripe CLI):

```bash
stripe listen --forward-to localhost:3002/api/stripe/webhook
```

Subscribe to at least:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Security Notes

- Never commit `.env.local`.
- Rotate any key accidentally exposed in screenshots/logs.
- Use least-privilege keys for external services where possible.

## Troubleshooting

### `No address provided to ConvexReactClient`

- Ensure `NEXT_PUBLIC_CONVEX_URL` exists in root `.env.local`
- Run `npm run sync:env`
- Restart `dev`

### `EADDRINUSE: 3002`

Kill existing process and restart:

```bash
lsof -ti:3002 | xargs kill -9
```

### Stripe checkout errors

- Verify `STRIPE_SECRET_KEY` is secret key (`sk_...`)
- Verify all Stripe price IDs exist in your Stripe account
- Verify webhook secret is `whsec_...`

