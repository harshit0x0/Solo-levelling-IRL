Phase 2: Core Engines (Backend Services)

Implemented
Step 2.1: Stat Engine Service
applyStatChange(playerId, changes)
applyDailyDecay(playerId) with decay rates from Draft2

Step 2.2: XP & Rank Engine Service
addXp(playerId, amount) - updates totalXp
recalculateLevel(player) - uses formula: 100 * level^1.5
recalculateRank(player) - XP thresholds from Draft2
Ensure rank is derived, never manually set

Step 2.3: Task Engine Service
generateDailyTask(player) - basic deterministic version first
submitTask(taskId, evidence) - creates TaskLog
resolveTask(taskLog, aiResult) - applies XP and stats
Basic task generation logic (weakest stat bias)

Step 2.4: Penalty Engine Service
applyMissPenalty(player) - stat decay on missed tasks
lockRankIfNeeded(player) - PSI calculation from Draft2
Penalty severity logic