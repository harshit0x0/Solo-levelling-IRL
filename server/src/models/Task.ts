import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type TaskType = 'daily' | 'dungeon' | 'boss';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type StatType = 'physical' | 'intelligence' | 'discipline' | 'charisma' | 'confidence' | 'creativity';

export interface TaskAttributes {
  id: number;
  type: TaskType;
  difficulty: Difficulty;
  description: string;
  targetStat: StatType;
  xpReward: number;
  deadline: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  declare id: number;
  declare type: TaskType;
  declare difficulty: Difficulty;
  declare description: string;
  declare targetStat: StatType;
  declare xpReward: number;
  declare deadline: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('daily', 'dungeon', 'boss'),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard', 'extreme'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    targetStat: {
      type: DataTypes.ENUM('physical', 'intelligence', 'discipline', 'charisma', 'confidence', 'creativity'),
      allowNull: false,
    },
    xpReward: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    timestamps: true,
  }
);
