import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type PenaltyReason = 'missed_task' | 'rank_lock' | 'xp_loss';

export interface PenaltyAttributes {
  id: number;
  playerId: number;
  reason: PenaltyReason;
  severity: number;
  expiresAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PenaltyCreationAttributes extends Optional<PenaltyAttributes, 'id' | 'expiresAt' | 'createdAt' | 'updatedAt'> {}

export class Penalty extends Model<PenaltyAttributes, PenaltyCreationAttributes> implements PenaltyAttributes {
  declare id: number;
  declare playerId: number;
  declare reason: PenaltyReason;
  declare severity: number;
  declare expiresAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Penalty.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'players',
        key: 'id',
      },
    },
    reason: {
      type: DataTypes.ENUM('missed_task', 'rank_lock', 'xp_loss'),
      allowNull: false,
    },
    severity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'penalties',
    timestamps: true,
  }
);
