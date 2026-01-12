import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface NarrativeAttributes {
  id: number;
  taskLogId: number;
  narrative: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NarrativeCreationAttributes extends Optional<NarrativeAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Narrative extends Model<NarrativeAttributes, NarrativeCreationAttributes> implements NarrativeAttributes {
  declare id: number;
  declare taskLogId: number;
  declare narrative: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Narrative.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taskLogId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'task_logs',
        key: 'id',
      },
    },
    narrative: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'narratives',
    timestamps: true,
  }
);
