![https://cdn.dribbble.com/userupload/31255225/file/original-1a7aadd6022933a83d01cdeafe5828e7.png?resize=400x0](https://cdn.dribbble.com/userupload/31255225/file/original-1a7aadd6022933a83d01cdeafe5828e7.png?resize=400x0)


# Draft-4: **Implementation Blueprint (From Zero → Working System)**

*This is where vision becomes code.*

Inspired by **Solo Leveling**, Draft-4 answers one question only:


---

# PART 1 — V1 SCOPE (HARD CUT)

Before code, we freeze scope.  
This prevents burnout and half-systems.

## ✅ V1 WILL HAVE

-   Single player (you)
    
-   Mobile-only web UI
    
-   Daily quest system
    
-   Stat decay
    
-   XP, level, rank
    
-   AI Judge (1 prompt)
    
-   Deterministic backend
    

## ❌ V1 WILL NOT HAVE

-   Multiplayer
    
-   Friends
    
-   Payments
    
-   Achievements UI polish
    
-   Real leaderboards
    
-   Push notifications
    

> If V1 loop is addictive → everything else is easy.

---

# PART 2 — SYSTEM ARCHITECTURE (MONOLITH, DONE RIGHT)

You are **time-constrained**, not careless.

### High-Level

```scss
Next.js (Mobile UI)
        ↓
API Layer (Node + TS)
        ↓
Domain Logic
        ↓
AI Engine
        ↓
Sequelize (Postgres)
```

### Key Principle

> **Business logic never lives in controllers**

---

# PART 3 — BACKEND FOLDER STRUCTURE 

```txt
server/
├─ src/
│  ├─ app.ts              // Express bootstrap
│  ├─ server.ts
│  │
│  ├─ config/
│  │   ├─ db.ts
│  │   └─ env.ts
│  │
│  ├─ models/             // Sequelize models
│  │   ├─ Player.ts
│  │   ├─ Stats.ts
│  │   ├─ Task.ts
│  │   ├─ TaskLog.ts
│  │
│  ├─ services/           // Business logic
│  │   ├─ player.service.ts
│  │   ├─ task.service.ts
│  │   ├─ stat.service.ts
│  │   ├─ xp.service.ts
│  │   ├─ penalty.service.ts
│  │
│  ├─ ai/
│  │   ├─ judge.ts
│  │   └─ questGenerator.ts
│  │
│  ├─ routes/
│  │   ├─ player.routes.ts
│  │   ├─ task.routes.ts
│  │   └─ ai.routes.ts
│  │
│  ├─ jobs/
│  │   └─ dailyDecay.job.ts
│  │
│  └─ utils/
│      ├─ rank.ts
│      └─ constants.ts
```

> This structure already supports scale & refactors.

---

# PART 4 — DATABASE MODELS (SEQUELIZE LLD)

### Player

```ts
id
rank
level
totalXp
createdAt
```

### Stats (1:1)

```ts
playerId
physical
intelligence
discipline
charisma
confidence
creativity
```

### Task

```ts
id
type        // DAILY
difficulty
description
targetStat
xpReward
deadline
```

### TaskLog

```ts
taskId
playerId
status      // PENDING | SUCCESS | FAILED
evidence
aiVerdict
```

---

# PART 5 — CORE SERVICES (THE BRAIN)

## 1️⃣ Stat Engine

```ts
applyStatChange(playerId, changes)
applyDailyDecay(playerId)
```

Rules:

-   Clamp stats (0–100)
    
-   Log every mutation
    

---

## 2️⃣ XP & Rank Engine

```ts
addXp(playerId, amount)
recalculateLevel(player)
recalculateRank(player)
```

Rank is derived, never manually set.

---

## 3️⃣ Task Engine

```ts
generateDailyTask(player)
submitTask(taskId, evidence)
resolveTask(taskLog, aiResult)
```

---

## 4️⃣ Penalty Engine

```ts
applyMissPenalty(player)
lockRankIfNeeded(player)
```

---

# PART 6 — AI IMPLEMENTATION 

### Judge Prompt (FINAL)

```txt
You are the Solo Leveling System.

Rules:
- Be strict.
- Do not reward excuses.
- Consistency matters more than intensity.
- Output VALID JSON only.

Evaluate this task completion.
```

### Expected Output Schema

```json
{
  "verdict": "success | fail",
  "xp": number,
  "statChanges": {
    "discipline": number,
    "confidence": number
  },
  "comment": string
}
```

> **You validate this JSON before applying anything.**

---

# PART 7 — DAILY CRON (THE PRESSURE LOOP)

### dailyDecay.job.ts

Runs once every 24h.

Flow:

1.  Fetch player
    
2.  Apply stat decay
    
3.  Check missed tasks
    
4.  Apply penalties
    
5.  Generate new daily quest
    

> This job is **non-optional**.  
> This is what creates tension.

---

# PART 8 — FRONTEND (NEXT.JS, MOBILE-FIRST)

### Enforced Mobile View

```css
max-width: 430px;
margin: auto;
```

---

## Pages (App Router)

```txt
/app
 ├─ page.tsx          // Status
 ├─ quests/page.tsx
 ├─ dungeon/page.tsx
 └─ logs/page.tsx
```

---

### Status Page (MVP)

-   Rank badge
    
-   XP progress bar
    
-   Stat bars
    
-   Titles (text only)
    

### Quest Page

-   One task
    
-   Accept → Submit evidence
    

### Dungeon Page

-   Locked (V1 placeholder)
    

---

# PART 9 — EVENT FLOW (IMPORTANT)

### Task Completion Flow

```pgsql
User submits evidence
 → API
 → AI Judge
 → Validate JSON
 → Apply XP
 → Apply Stats
 → Log result
 → Return narration
```

Everything is traceable.

---

# PART 10 — FIRST 7 DAYS EXECUTION PLAN

## Day 1

-   Repo setup
    
-   Sequelize + Postgres
    
-   Player + Stats models
    

## Day 2

-   XP, Rank, Stat engines
    

## Day 3

-   Task generation logic
    
-   Daily quest creation
    

## Day 4

-   AI Judge integration
    

## Day 5

-   Task submission flow
    
-   Penalties
    

## Day 6

-   Mobile UI MVP
    

## Day 7

-   Polish + test discipline loop
    

---

# PART 11 — HOW THIS PROJECT LEVELS *YOU*

While building:

-   You learn **domain-driven design**
    
-   You learn **AI orchestration**
    
-   You learn **behavioral systems**
    
-   You practice **real system design**
    

This project itself is:

> **A B-Rank Dungeon → A-Rank Transformation**

---

# PART 12 — FINAL RULE (IMPORTANT)

🚫 **DO NOT add features when bored**  
✅ **Tighten the loop instead**

If the daily quest hurts a little —  
You are building it right.

---
