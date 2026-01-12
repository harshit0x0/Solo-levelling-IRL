import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database';
import { startDailyDecayJob } from './jobs/dailyDecay.job';
import { getPlayerStatus } from './services/player.service';
import { getActiveTasks, submitTask, judgeAndResolveTask, getTaskHistory, getTaskNarrative, getPlayerNarratives, getPlayerTaskStats } from './services/task.service';
import { judgeTask } from './ai/judge';
import { generateQuestSuggestion } from './ai/quest-generator';
// import bodyParser from 'body-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Standardized response handler
 * Wraps all successful responses in a consistent format
 */
function responseHandler<T>(res: express.Response, statusCode: number, data: T, message?: string) {
  const response: { success: boolean; message?: string; data?: T; error?: string } = {
    success: statusCode >= 200 && statusCode < 300,
  };

  if (message) {
    response.message = message;
  }

  if (response.success) {
    response.data = data;
  } else {
    response.error = typeof data === 'string' ? data : 'An error occurred';
  }

  return res.status(statusCode).json(response);
}

/**
 * Async error handler wrapper (catchAsync)
 * Wraps async route handlers to catch errors and pass them to error middleware
 */
function catchAsync(
  fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>
) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Handle validation errors (from service layer)
  if (err.message.includes('not found') || err.message.includes('Not found')) {
    return responseHandler(res, 404, err.message);
  }
  
  // Handle bad request errors
  if (err.message.includes('required') || err.message.includes('must be') || err.message.includes('invalid')) {
    return responseHandler(res, 400, err.message);
  }
  
  // Default to 500 for unexpected errors
  return responseHandler(res, 500, err.message || 'Internal server error');
});

// Health check endpoint
app.get('/api/health', catchAsync(async (_req, res) => {
  await sequelize.authenticate();
  responseHandler(res, 200, { status: 'ok', database: 'connected' });
}));

// Player Routes
app.get('/api/player/status', catchAsync(async (req, res) => {
  const playerId = parseInt(req.query.playerId as string, 10);
  
  if (!playerId || isNaN(playerId)) {
    throw new Error('playerId query parameter is required and must be a number');
  }

  const result = await getPlayerStatus(playerId);
  responseHandler(res, 200, result);
}));

// Task Routes
app.get('/api/tasks/current', catchAsync(async (req, res) => {
  const playerId = parseInt(req.query.playerId as string, 10);
  
  if (!playerId || isNaN(playerId)) {
    throw new Error('playerId query parameter is required and must be a number');
  }

  const activeTasks = await getActiveTasks(playerId);
  
  // Return the first active daily task, or null if none
  const currentTask = activeTasks.find(task => task.type === 'daily') || null;
  
  responseHandler(res, 200, { task: currentTask });
}));

app.post('/api/tasks/:id/submit', catchAsync(async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const playerId = parseInt(req.body.playerId, 10);
  const evidence = req.body.evidence;

  if (!taskId || isNaN(taskId)) {
    throw new Error('Task ID must be a valid number');
  }

  if (!playerId || isNaN(playerId)) {
    throw new Error('playerId is required and must be a number');
  }

  if (!evidence || typeof evidence !== 'string') {
    throw new Error('evidence is required and must be a string');
  }

  // Submit task (creates TaskLog with pending status)
  const taskLog = await submitTask(taskId, playerId, evidence);

  // Auto-judge and resolve the task
  const resolvedTaskLog = await judgeAndResolveTask(taskLog.id);

  responseHandler(res, 200, { taskLog: resolvedTaskLog }, 'Task submitted and judged successfully');
}));

app.get('/api/tasks/history', catchAsync(async (req, res) => {
  const playerId = parseInt(req.query.playerId as string, 10);

  if (!playerId || isNaN(playerId)) {
    throw new Error('playerId query parameter is required and must be a number');
  }

  const taskLogs = await getTaskHistory(playerId);
  responseHandler(res, 200, { taskLogs });
}));

// Narrative Routes
app.get('/api/tasks/:taskLogId/narrative', catchAsync(async (req, res) => {
  const taskLogId = parseInt(req.params.taskLogId, 10);

  if (!taskLogId || isNaN(taskLogId)) {
    throw new Error('taskLogId parameter is required and must be a number');
  }

  const narrative = await getTaskNarrative(taskLogId);

  if (!narrative) {
    throw new Error('Narrative not found');
  }

  responseHandler(res, 200, narrative);
}));

app.get('/api/player/narratives', catchAsync(async (req, res) => {
  const playerId = parseInt(req.query.playerId as string, 10);

  if (!playerId || isNaN(playerId)) {
    throw new Error('playerId query parameter is required and must be a number');
  }

  const narratives = await getPlayerNarratives(playerId);
  responseHandler(res, 200, { narratives });
}));

// Analytics Routes
app.get('/api/player/task-stats', catchAsync(async (req, res) => {
  const playerId = parseInt(req.query.playerId as string, 10);

  if (!playerId || isNaN(playerId)) {
    throw new Error('playerId query parameter is required and must be a number');
  }

  const taskStats = await getPlayerTaskStats(playerId);
  responseHandler(res, 200, taskStats);
}));

// AI Routes (for testing)
app.post('/api/ai/judge', catchAsync(async (req, res) => {
  console.log("Route hit");
  const { task, playerStats, evidence } = req.body;

  if (!task || !playerStats || !evidence) {
    throw new Error('task, playerStats, and evidence are required');
  }

  const judgeResponse = await judgeTask({
    task,
    playerStats,
    evidence,
  });

  responseHandler(res, 200, judgeResponse);
}));

app.post('/api/ai/quest-suggestion', catchAsync(async (req, res) => {
  const { playerStats, recentFailures, rank, weakestStat, desiredDifficulty } = req.body;

  if (!playerStats || !rank || !weakestStat || !desiredDifficulty) {
    throw new Error('playerStats, rank, weakestStat, and desiredDifficulty are required');
  }

  const questSuggestion = await generateQuestSuggestion({
    playerStats,
    recentFailures: recentFailures || [],
    rank,
    weakestStat,
    desiredDifficulty,
  });

  responseHandler(res, 200, questSuggestion);
}));

// Test database connection on startup
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync models (for development - use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synced.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // Start daily cron job
    startDailyDecayJob();
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    process.exit(1);
  }
}

startServer();