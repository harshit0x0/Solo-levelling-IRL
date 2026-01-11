---

# System Canon — Real Solo Leveling (RL-SLS)

## 1\. Core Identity

This project is a **real-life gamification system** inspired by Solo Leveling.  
It is **not** a productivity app or habit tracker.

The user is a **Player** whose real-life actions determine progress through:

-   XP
    
-   Levels
    
-   Ranks
    
-   Stats
    
-   Titles
    
-   Penalties
    

The system is strict, deterministic-first, AI-assisted second.

---

## 2\. Non-Negotiable Laws

1.  **Progress must be earned** — no manual stat edits.
    
2.  **Inaction is a negative action** — decay and penalties apply.
    
3.  **Difficulty escalates with comfort** — stagnation triggers pressure.
    
4.  **Identity affects gameplay** — titles bias future tasks.
    
5.  **Deterministic logic > AI judgment** — AI advises, rules decide.
    

These laws must never be violated.

---

## 3\. Core Systems

### Player

-   Rank: E → D → C → B → A → S → SS
    
-   Level: micro progression within rank
    
-   Total XP: lifetime, never decays
    

### Stats (0–100, clamped)

-   Physical
    
-   Intelligence
    
-   Discipline
    
-   Charisma
    
-   Confidence
    
-   Creativity
    

Stats **decay daily** and are affected by tasks, penalties, and titles.

---

## 4\. XP, Levels, Ranks

-   XP is awarded via tasks.
    
-   Levels scale via XP (non-linear).
    
-   Rank is derived from **total XP**, never manually set.
    
-   Stats can fluctuate; rank represents historical growth.
    

---

## 5\. Task System

### Task Types

-   **Daily Quests**: mandatory, low XP, prevent decay.
    
-   **Dungeons**: multi-day commitments, high pressure.
    
-   **Boss Fights**: rare, high-stakes life goals.
    

Tasks have:

-   Type
    
-   Difficulty
    
-   Target stat
    
-   XP reward
    
-   Deadline
    
-   Verification via AI Judge
    

---

## 6\. Penalty System

-   Missing tasks triggers penalties.
    
-   Penalties include:
    
    -   Stat decay
        
    -   XP loss
        
    -   Rank locks (temporary)
        
-   Penalty severity scales with frequency and difficulty.
    
-   Fear of loss is intentional and required.
    

---

## 7\. Titles (Identity Engine)

Titles are **earned**, not cosmetic.

-   Examples: Engineer, Strategist, Athlete, Monk
    
-   Titles modify:
    
    -   Stat bonuses
        
    -   XP multipliers
        
    -   Task generation bias
        

Identity changes future gameplay.

---

## 8\. AI System (Strictly Scoped)

AI never mutates database state directly.

### AI Roles

1.  **Judge** – evaluates task completion objectively.
    
2.  **Quest Generator** – suggests tasks based on weaknesses.
    
3.  **Narrator** – adds story and psychological reinforcement.
    
4.  **Balancer** – detects exploitation and adjusts difficulty.
    

AI outputs **structured JSON only** and is always validated.

---

## 9\. Anti-Cheat Philosophy

Cheating cannot be fully prevented; it is made **pointless** by:

-   Diminishing XP
    
-   Suspicion-based balancing
    
-   Stat penalties (especially confidence)
    
-   Narrative callouts
    

---

## 10\. Technical Constraints

### Stack

-   Backend: Node.js + TypeScript + Sequelize + PostgreSQL
    
-   Frontend: Next.js (mobile-only web)
    
-   Architecture: clean monolith
    

### Design Rules

-   Business logic lives in services, never in routes.
    
-   AI is advisory, never authoritative.
    
-   Everything is event-driven and logged.
    
-   System must be extensible and scalable.
    

---

## 11\. V1 Scope (Hard Cut)

### Included

-   Single player
    
-   Daily quests
    
-   Stat decay
    
-   XP, levels, ranks
    
-   One AI Judge
    
-   Mobile-only UI
    

### Excluded

-   Multiplayer
    
-   Social features
    
-   Payments
    
-   Leaderboards
    
-   Push notifications
    

---

## 12\. Guiding Principle

This system exists to **force real growth through structured pressure**.

Comfort is a failure state.  
Consistency is the primary victory condition.

---

### System Status

**Initialized. Growth is no longer optional.**

---
