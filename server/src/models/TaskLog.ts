import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type TaskStatus = 'pending' | 'completed' | 'failed' | 'missed';

export interface TaskLogAttributes {
  id: number;
  taskId: number;
  playerId: number;
  status: TaskStatus;
  evidence: string | null;
  aiVerdict: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskLogCreationAttributes extends Optional<TaskLogAttributes, 'id' | 'evidence' | 'aiVerdict' | 'createdAt' | 'updatedAt'> {}

export class TaskLog extends Model<TaskLogAttributes, TaskLogCreationAttributes> implements TaskLogAttributes {
  declare id: number;
  declare taskId: number;
  declare playerId: number;
  declare status: TaskStatus;
  declare evidence: string | null;
  declare aiVerdict: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TaskLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id',
      },
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'players',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'missed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    evidence: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    aiVerdict: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'task_logs',
    timestamps: true,
  }
);
