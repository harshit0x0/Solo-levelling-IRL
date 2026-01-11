
![https://www.carljamilkowski.com/wp-content/uploads/2024/04/solo-leveling-2024-s01e04-dungeon.jpg](https://www.carljamilkowski.com/wp-content/uploads/2024/04/solo-leveling-2024-s01e04-dungeon.jpg)


# Draft-2: **System Mechanics, Math & Architecture Blueprint**

*(This is where your project becomes real and non-generic)*

Draft-2 locks down the **rules of the universe**.

> A game lives or dies by its mechanics.  
> If mechanics are weak → motivation dies.  
> If mechanics are strict → growth becomes inevitable.

---

## 1\. Non-Negotiable Design Laws

Before numbers, define laws. These should **never change**, even if features do.

### LAW 1 — Progress Must Be **Earned**

No manual stat editing.  
Everything flows from logs → computation → stats.

### LAW 2 — Inaction Is a Negative Action

Doing nothing is worse than failing.

### LAW 3 — Difficulty Scales Faster Than Comfort

If user adapts, system escalates.

### LAW 4 — Identity Shapes Gameplay

Titles and ranks influence future tasks.

---

## 2\. Rank System (E → SS) – Exact Thresholds

Ranks are **macro-states**, not levels.

### Rank Thresholds (XP-Based)

```txt
E  : 0 – 999 XP
D  : 1,000 – 4,999
C  : 5,000 – 14,999
B  : 15,000 – 39,999
A  : 40,000 – 99,999
S  : 100,000 – 249,999
SS : 250,000+
```

> XP is **lifetime**, but stats fluctuate.

### Why XP, Not Stats?

-   Stats can decay
    
-   XP represents **history**
    
-   Rank = reputation, not mood
    

---

## 3\. Level System (Micro Progress)

Levels reset pressure **inside** a rank.

### Level Formula

```ts
xpRequired(level) = 100 * level^1.5
```

Example:

-   Level 1 → 100 XP
    
-   Level 5 → ~1,118 XP
    
-   Level 20 → ~8,944 XP
    

---

## 4\. Stats – Exact Computation Model

Stats range: **0 → 100**

### Base Stat Formula

```ts
stat =
  base
+ completedTaskWeight
- decay
+ titleModifiers
```

### Stat Decay (Daily)

| Stat | Daily Decay |
| --- | --- |
| Discipline | \-0.2 |
| Physical | \-0.1 |
| Intelligence | \-0.05 |
| Confidence | \-0.1 |
| Charisma | \-0.05 |
| Creativity | \-0.05 |

> Decay enforces **maintenance**, not perfection.

---

## 5\. XP Rewards – Math That Scales Pain

### Task Difficulty Multiplier

| Difficulty | Multiplier |
| --- | --- |
| Easy | 1.0 |
| Medium | 1.5 |
| Hard | 2.5 |
| Extreme | 4.0 |

### XP Formula

```ts
xp =
baseXP
* difficultyMultiplier
* disciplineModifier
```

```ts
disciplineModifier = 1 + (discipline / 100)
```

> High discipline **amplifies** progress → positive feedback loop.

---

## 6\. Task Types – Locked Behavior Design

### 1\. Daily Quests

-   Mandatory
    
-   Low XP
    
-   Prevent stat decay
    

```ts
XP: 20–40
Penalty if missed: Discipline -1
```

### 2\. Weekly Missions

-   Growth-focused
    
-   Moderate XP
    

```ts
XP: 200–500
```

### 3\. Dungeons (Sprints)

-   3–14 day commitment
    
-   Multi-step tasks
    

```ts
XP: 2,000–10,000
Failure penalty: Confidence -5
```

### 4\. Boss Fights

-   Rare
    
-   Life-changing goals
    

```ts
XP: 20,000+
Unlocks Titles
```

---

## 7\. Penalty System (Hard Truth Layer)

### Penalty Severity Index (PSI)

```ts
PSI = missedTasks * difficulty * streakFactor
```

### Penalty Effects

| PSI | Effect |
| --- | --- |
| < 5 | Warning |
| 5–10 | Stat decay |
| 10–20 | XP loss |
| 20+ | Rank lock |

> Rank lock = cannot rank up for N days.

---

## 8\. Titles – Identity Alters Mechanics

### Title Unlock Pattern

```ts
if (
  completedProjects >= 3 &&
  intelligence > 60
) unlock("Engineer")
```

### Title Effects Example

```ts
Engineer:
  +10 intelligence
  +5 creativity
  logicTasksXP +20%
```

> Titles **bias** future task generation.

---

## 9\. AI System – Prompt Architecture (Important)

AI ≠ free-form chat.

### AI Has 4 Modes

1.  **Judge**
    
2.  **Quest Generator**
    
3.  **Narrator**
    
4.  **Balancer**
    

---

### Example: Judge Prompt (Internal)

```pgsql
You are the Solo Leveling System.
Evaluate task completion objectively.
Penalize excuses.
Reward consistency over intensity.
Output JSON only.
```

### Output

```json
{
  "success": true,
  "xpAwarded": 120,
  "statChanges": {
    "discipline": +1,
    "confidence": +0.5
  }
}
```

---

## 10\. Backend Architecture (V1 – Scalable)

### Services (Logical)

```arduino
Auth Service
Player Engine
Task Engine
Stat Engine
AI Engine
Penalty Engine
```

> Initially monolith  
> Later split into services

---

## 11\. Database – Core Tables (Exact)

### players

```sql
id
rank
level
total_xp
created_at
```

### stats

```sql
player_id
physical
intelligence
discipline
charisma
confidence
creativity
```

### tasks

```sql
id
type
difficulty
stat_target
xp_reward
deadline
```

### task\_logs

```sql
task_id
player_id
status
evidence
ai_verdict
```

### penalties

```sql
player_id
reason
severity
expires_at
```

---

## 12\. Frontend – Mobile-Only UI Logic

### Navigation (Bottom)

-   Status
    
-   Quests
    
-   Dungeon
    
-   Logs
    

### Status Screen

-   Rank badge
    
-   Animated stat bars
    
-   Titles carousel
    

### Quest Screen

-   One active task visible
    
-   Swipe to accept
    
-   Swipe to submit
    

> Reduce thinking → increase action.

---

## 13\. V1 Milestone Plan (Realistic)

### Week 1

-   Auth
    
-   Player model
    
-   Stats engine
    

### Week 2

-   Task engine
    
-   Daily quests
    
-   XP & rank math
    

### Week 3

-   AI judge
    
-   Penalty system
    
-   UI polish
    

---

## 14\. System Design Insight (For You)

This project teaches:

-   **Feedback loops**
    
-   **Negative reinforcement**
    
-   **Progressive overload**
    
-   **Event-driven systems**
    
-   **Behavioral economics**
    

You’re building:

> A **human improvement compiler**

---

## 15\. Reality Check (Important)

This system **will work** only if:

-   You don’t soften penalties
    
-   You don’t allow cheating
    
-   You treat yourself as Player-1
    

Most people quit at C-Rank.

---


### Final Line

You are no longer *planning* a project.  
You are **designing a system that reshapes behavior**.