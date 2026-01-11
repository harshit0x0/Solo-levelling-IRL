import sequelize from '../config/database';
import { Player } from './Player';
import { Stats } from './Stats';
import { Task } from './Task';
import { TaskLog } from './TaskLog';

// Initialize models
const models = {
  Player,
  Stats,
  Task,
  TaskLog,
  sequelize,
};

// Setup associations
Player.hasOne(Stats, { foreignKey: 'playerId', as: 'stats' });
Stats.belongsTo(Player, { foreignKey: 'playerId', as: 'player' });

Player.hasMany(TaskLog, { foreignKey: 'playerId', as: 'taskLogs' });
TaskLog.belongsTo(Player, { foreignKey: 'playerId', as: 'player' });

Task.hasMany(TaskLog, { foreignKey: 'taskId', as: 'taskLogs' });
TaskLog.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

export default models;
