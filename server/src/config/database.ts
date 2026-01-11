import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'solo_leveling',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

export default sequelize;
