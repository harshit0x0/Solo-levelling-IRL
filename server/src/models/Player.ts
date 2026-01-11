import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';

export interface PlayerAttributes {
  id: number;
  rank: Rank;
  level: number;
  totalXp: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlayerCreationAttributes extends Optional<PlayerAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Player extends Model<PlayerAttributes, PlayerCreationAttributes> implements PlayerAttributes {
  public id!: number;
  public rank!: Rank;
  public level!: number;
  public totalXp!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Player.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rank: {
      type: DataTypes.ENUM('E', 'D', 'C', 'B', 'A', 'S', 'SS'),
      allowNull: false,
      defaultValue: 'E',
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    totalXp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'players',
    timestamps: true,
  }
);
