import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface StatsAttributes {
  id: number;
  playerId: number;
  physical: number;
  intelligence: number;
  discipline: number;
  charisma: number;
  confidence: number;
  creativity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StatsCreationAttributes extends Optional<StatsAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Stats extends Model<StatsAttributes, StatsCreationAttributes> implements StatsAttributes {
  public id!: number;
  public playerId!: number;
  public physical!: number;
  public intelligence!: number;
  public discipline!: number;
  public charisma!: number;
  public confidence!: number;
  public creativity!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Stats.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'players',
        key: 'id',
      },
    },
    physical: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100,
      },
    },
    intelligence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100,
      },
    },
    discipline: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100,
      },
    },
    charisma: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100,
      },
    },
    confidence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100,
      },
    },
    creativity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100,
      },
    },
  },
  {
    sequelize,
    tableName: 'stats',
    timestamps: true,
  }
);
