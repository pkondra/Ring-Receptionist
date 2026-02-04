# What Works, What Doesn't, and How to Test

## How to Run the App

### Prerequisites

- Node.js 20+
- pnpm 10+
- A [Clerk](https://clerk.com) account with a JWT template named `convex`
- A [Convex](https://convex.dev) account
- An [ElevenLabs](https://elevenlabs.io) API key
- An [OpenAI](https://platform.openai.com) API key (lead extraction)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Create `apps/web/.env.local` with:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
ELEVENLABS_API_KEY=sk_...
OPENAI_API_KEY=sk_...
```

Set `CLERK_JWT_ISSUER_DOMAIN` in your Convex dashboard environment variables (not locally).

### 3. Start development

```bash
pnpm dev
```

This runs the Next.js web app and the Convex dev server in parallel. The web app will be at `http://localhost:3000`.

---

## What Works (Implemented)

### Multi-Agent System

| Feature | Route | Status |
|---------|-------|--------|
| Agent list/grid page | `/dashboard/agents` | Done |
| Create new agent form | `/dashboard/agents/new` | Done |
| Per-agent settings page | `/dashboard/agents/[agentId]/settings` | Done |
| Dashboard shows all agents | `/dashboard` | Done |
| Delete agent with cascade | Per-agent settings > Danger Zone | Done |

### Agent Configuration (Per-Agent)

- **Basic Info**: Edit agent name, business name, tone style, tone description
- **Qualification Goals**: Add, remove, edit goals with key/label/required toggle
- **Emergency Protocol**: Add, remove triggers (keyword + action dropdown), edit instructions textarea
- **Save & Sync**: Saves all settings to Convex, then syncs the agent to ElevenLabs (creates or updates)

### Knowledge Base (Shared)

- Shared knowledge base applies to all agents in a workspace
- Add text entries (title + content) -- saved to Convex, then synced to ElevenLabs as KB text documents
- Edit existing entries (title + content) -- re-uploaded to ElevenLabs and updated in Convex
- Delete entries -- removed from both ElevenLabs and Convex
- Synced entries show a green "Synced" badge
- Agents auto-resync after KB changes to include the latest `knowledge_base`

### Navigation

- Sidebar nav updated to: Dashboard, Agents, Knowledge Base, Leads, Calls, Appointments
- Active link highlighting works for nested routes (e.g. `/dashboard/agents/new` highlights "Agents")

### Leads & Calls

- Leads list at `/dashboard/leads` shows extracted lead fields by call
- Calls list at `/dashboard/calls` shows session history and durations
- Calls list lets you expand and view the full transcript

### Default Agent

- Any agent can be set as the default from its settings page
- Default agent is highlighted in the agent grid and sorted first

### Voice Lab

- Voice chat at `/chat/[agentId]` works for any agent that has been synced to ElevenLabs
- If an agent isn't connected, it shows a message with a link to that agent's settings page

### Agent Deletion

- Clicking "Delete Agent" in the Danger Zone shows a confirmation step
- On confirm: deletes the ElevenLabs agent, deletes all ElevenLabs KB docs for that agent, then cascade-deletes in Convex (knowledge entries, chat sessions, chat messages, agent config)
- Redirects to `/dashboard/agents` after deletion

### Convex Backend

- `knowledgeEntries` table added to schema with `by_agent` index
- `listAgents(workspaceId)` query returns all agents for a workspace
- `createAgent(...)` mutation creates a new agent with `isDefault: false`
- `deleteAgent(agentConfigId)` mutation cascade-deletes all related data
- `updateAgentConfig(...)` now accepts `qualificationGoals` and `emergencyProtocol`
- `knowledgeEntries` module: `listByAgent`, `addEntry`, `updateEntry`, `deleteEntry`

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/elevenlabs/upsert-agent` | POST | Create/update ElevenLabs agent (now includes KB) |
| `/api/elevenlabs/knowledge` | POST | Create a KB text document in ElevenLabs |
| `/api/elevenlabs/knowledge` | DELETE | Delete a KB text document from ElevenLabs |
| `/api/elevenlabs/delete-agent` | POST | Delete ElevenLabs agent + Convex cascade |
| `/api/elevenlabs/signed-url` | GET | Get WebRTC signed URL (unchanged) |
| `/api/lead-extraction` | POST | Extract structured lead fields via GPT-4o-mini |
| `/api/call-summary` | POST | Summarize call transcript via GPT-4o-mini |

---

## What Doesn't Work / Known Gaps

### No Agent Reordering (Yet)

Agents can be set as default, but drag-and-drop reordering in the grid is not implemented.

### No Convex Schema Migration

If you already have data in your Convex database, adding the `knowledgeEntries` table should be fine (new tables don't affect existing data). But verify by running `npx convex dev` and checking for schema push errors.

---

## What to Test

### 1. First Run / Account Setup

1. Sign up or sign in via the landing page
2. You should land on `/dashboard`
3. The default agent ("TreeLine Receptionist") should appear in the grid
4. Verify the sidebar shows: Dashboard, Agents, Leads, Calls

### 2. Create a New Agent

1. Go to `/dashboard/agents` or click "Agents" in the sidebar
2. Click "Create New Agent"
3. Fill in agent name and business name (required), adjust tone if desired
4. Click "Create Agent"
5. Verify you're redirected to `/dashboard/agents/[newId]/settings`
6. Verify the new agent appears in the agents grid

### 3. Edit Agent Settings

1. From the agent settings page, change the agent name, business name, tone
2. Add/remove qualification goals -- verify the key, label, and required toggle work
3. Add/remove emergency triggers -- verify keyword input and action dropdown work
4. Edit emergency instructions textarea
5. Click "Set as Default" for a non-default agent and confirm it switches
6. Click "Save & Sync to ElevenLabs"
7. Verify the success message appears
8. Verify the green "Connected to ElevenLabs" status dot appears

### 4. Knowledge Base

1. In agent settings, scroll to the Knowledge Base section
2. Click "+ Add Entry"
3. Enter a title and content, click "Add Entry"
4. Verify the entry appears with a green "Synced" badge (may take a moment)
5. Click the edit icon on an entry, change the title/content, save (should re-sync to ElevenLabs)
6. Click the delete icon on an entry, verify it disappears
7. Click "Save & Sync to ElevenLabs" to ensure the agent references the KB entries

### 5. Voice Lab

1. From the agent card on the dashboard or agents page, click "Voice Lab"
2. Verify you land on `/chat/[agentId]`
3. Click "Start Voice Chat" (requires microphone permission)
4. Talk to the agent -- it should use the custom prompt, tone, goals, and KB
5. Stop the chat and verify the transcript and extracted fields appear

### 6. Leads & Calls Pages

1. Visit `/dashboard/leads` and verify the lead list populates after a call
2. Visit `/dashboard/calls` and verify call durations and status

### 7. Delete an Agent

1. Go to an agent's settings page
2. Scroll to "Danger Zone"
3. Click "Delete Agent"
4. Click "Yes, Delete Agent" to confirm
5. Verify you're redirected to `/dashboard/agents`
6. Verify the agent is gone from the grid
7. If the agent was connected to ElevenLabs, verify it no longer exists there

### 8. Multiple Agents

1. Create 2-3 agents with different names, tones, and goals
2. Connect each to ElevenLabs
3. Open Voice Lab for each and verify they have independent prompts
4. Delete one and verify the others are unaffected

### 9. Edge Cases

- Create an agent with empty tone fields -- should still work
- Try to access `/dashboard/agents/invalid-id/settings` -- should show "Agent not found"
- Try Voice Lab for an unconnected agent -- should show the "not connected" message with a link to settings
- Delete all agents, verify the dashboard shows the "No agents yet" empty state
- Refresh the page mid-edit -- form should re-populate from Convex data

---

## File Summary

### New Files Created

| File | Purpose |
|------|---------|
| `convex/knowledgeEntries.ts` | CRUD for knowledge base entries |
| `apps/web/lib/agentDefaults.ts` | Default qualification goals, emergency triggers, types |
| `apps/web/app/dashboard/agents/page.tsx` | Agent list/grid page |
| `apps/web/app/dashboard/agents/new/page.tsx` | Create agent form |
| `apps/web/app/dashboard/agents/[agentId]/settings/page.tsx` | Per-agent settings |
| `apps/web/components/QualificationGoalsEditor.tsx` | Editable qualification goals list |
| `apps/web/components/EmergencyProtocolEditor.tsx` | Editable triggers + instructions |
| `apps/web/components/KnowledgeBaseEditor.tsx` | KB entry CRUD with ElevenLabs sync |
| `apps/web/app/api/elevenlabs/knowledge/route.ts` | ElevenLabs KB create/delete API |
| `apps/web/app/api/elevenlabs/delete-agent/route.ts` | ElevenLabs agent delete + Convex cascade |
| `apps/web/app/api/lead-extraction/route.ts` | GPT-4o-mini lead extraction endpoint |
| `apps/web/app/dashboard/leads/page.tsx` | Leads list page |
| `apps/web/app/dashboard/calls/page.tsx` | Calls history page |
| `apps/web/app/api/call-summary/route.ts` | GPT-4o-mini call summary endpoint |
| `apps/web/app/dashboard/knowledge/page.tsx` | Shared knowledge base page |
| `apps/web/app/dashboard/appointments/page.tsx` | Appointments placeholder page |
| `apps/web/components/WorkspaceKnowledgeBaseEditor.tsx` | Shared KB editor |
| `convex/workspaceKnowledgeEntries.ts` | Shared KB CRUD |

### Modified Files

| File | Changes |
|------|---------|
| `convex/schema.ts` | Added `knowledgeEntries` table |
| `convex/agentConfigs.ts` | Default agent selection + cascade handling |
| `convex/chatSessions.ts` | Workspace leads/calls listing queries |
| `apps/web/app/api/elevenlabs/upsert-agent/route.ts` | Fetches KB entries, includes `knowledge_base` in payload |
| `apps/web/app/api/elevenlabs/knowledge/route.ts` | Force-delete KB docs when removing |
| `apps/web/app/api/elevenlabs/delete-agent/route.ts` | Force-delete KB docs during cascade |
| `apps/web/app/dashboard/page.tsx` | Multi-agent grid instead of single agent card |
| `apps/web/components/DashboardNav.tsx` | Updated nav items, improved active link detection |
| `apps/web/components/VoiceChatLab.tsx` | GPT-4o-mini extraction + richer memory facts |
| `apps/web/lib/extractLeadFields.ts` | AI extraction helper with fallback |
| `apps/web/app/globals.css` | Updated light-mode design tokens |
| `apps/web/app/dashboard/agents/[agentId]/settings/page.tsx` | Shared KB link instead of per-agent editor |

### Deleted Files

| File | Reason |
|------|--------|
| `apps/web/app/dashboard/settings/page.tsx` | Replaced by per-agent settings |
| `apps/web/app/dashboard/voice-lab/page.tsx` | Voice lab is now per-agent via `/chat/[agentId]` |
