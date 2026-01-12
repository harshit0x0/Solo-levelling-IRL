Phase 3 Handoff: AI Judge Integration
Completed Steps

Step 3.1: AI Judge Module
Created server/src/ai/judge.ts with judgeTask() function
Created server/src/ai/validation.ts for JSON response validation
Uses OpenAI gpt-4.1-mini with JSON mode
Deterministic fallback on AI failures (default XP by difficulty)
Tests in server/tests/ai/judge.test.ts with mocked responses
Step 3.2: AI Integration with Task Engine
Added judgeAndResolveTask(taskLogId) in task.service.ts
Flow: Task Service → AI Judge → Validation → Stat/XP Services → DB
AI never mutates DB directly; all changes via xp.service and stat.service
Tests added in server/tests/task.service.test.ts

Project Structure

Backend (server/):
src/services/ - Business logic services
task.service.ts - Task generation, submission, resolution
xp.service.ts - XP management and level/rank calculation
stat.service.ts - Stat changes and daily decay
penalty.service.ts - Penalty application and PSI calculation
src/models/ - Sequelize models (Player, Stats, Task, TaskLog, Penalty)
src/config/ - Database configuration (database.ts)
src/ai/ - AI modules (judge.ts, validation.ts)
src/migrations/ - Sequelize migrations
tests/ - Jest test files with setup.ts for DB cleanup

Database:
PostgreSQL via Sequelize ORM
Environment variables: DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
.env file at project root (loaded via dotenv.config() with path resolution)
Key Services Reference
Task Service (task.service.ts):
generateDailyTask(playerId) - Creates daily task targeting weakest stat
submitTask(taskId, playerId, evidence) - Creates pending TaskLog
judgeAndResolveTask(taskLogId) - Calls AI Judge and resolves task
resolveTask(taskLog, resolution) - Applies XP/stats via services
checkAndMarkMissedTasks(playerId) - Marks overdue pending tasks as 'missed'
XP Service (xp.service.ts):
addXp(playerId, amount) - Adds XP and recalculates level/rank
Level formula: 100 * level^1.5
Rank derived from total XP thresholds (E|D|C|B|A|S|SS)
Stat Service (stat.service.ts):
applyStatChange(playerId, changes) - Applies stat changes (0-100 range)
applyDailyDecay(playerId) - Applies daily stat decay (from Phase 2)
Penalty Service (penalty.service.ts):
applyMissPenalty(player) - Applies stat decay for missed tasks
lockRankIfNeeded(player) - PSI calculation for rank locking

Models
Player:
Fields: id, rank, level, totalXp
Associations: hasOne(Stats), hasMany(TaskLog)
Stats:
Fields: playerId, physical, intelligence, discipline, charisma, confidence, creativity (all 0-100)
Association: belongsTo(Player)
Task:
Fields: id, type, difficulty, description, targetStat, xpReward, deadline
Types: 'daily' | 'weekly' | 'dungeon' | 'boss'
Difficulties: 'easy' | 'medium' | 'hard' | 'extreme'
TaskLog:
Fields: id, taskId, playerId, status, evidence, aiVerdict
Status: 'pending' | 'completed' | 'failed' | 'missed'
Associations: belongsTo(Player), belongsTo(Task)
Penalty:
Fields: id, playerId, reason, severity, expiresAt
Testing Patterns
Jest with ts-jest preset
tests/setup.ts handles DB sync and cleanup (truncates after each test)
Tests use models import from src/models/index.ts
Mock patterns: Use jest.mock() for external dependencies (e.g., OpenAI)
Environment Configuration
.env at project root
Loaded via dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') })
Required: OPENAI_API_KEY, database credentials


For Phase 4: Daily Cron Job
Daily Flow Requirements:
Fetch all players (or iterate through players)
Apply stat decay: applyDailyDecay(playerId) from stat.service.ts
Check missed tasks: checkAndMarkMissedTasks(playerId) from task.service.ts
Apply penalties: Use penalty.service.ts for missed tasks
Generate new daily task: generateDailyTask(playerId) from task.service.ts
Note: Consider handling pending TaskLogs before marking missed tasks. Either:
Auto-judge pending tasks that are close to deadline, or
Let them become missed and apply penalties
Cron Setup:
Use node-cron package (add to dependencies)
Schedule for daily execution (e.g., midnight or early morning)
Add logging for job runs and errors
Consider transaction handling for atomic operations per player
Job Location:
Create server/src/jobs/ directory
File: dailyDecay.job.ts (or similar naming convention)
Export job function that can be called by cron scheduler