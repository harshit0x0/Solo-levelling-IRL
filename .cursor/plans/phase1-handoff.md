# Phase 1 Handoff Brief

## Overview
Phase 1 establishes the foundation: monorepo structure, database connection, core models, migrations, and basic tooling. The backend is ready for service layer implementation (Phase 2).

## Project Structure

```
RL-SLS/
├── server/              # Backend (Node.js + Express + Sequelize + PostgreSQL)
│   ├── src/
│   │   ├── config/      # Database configuration
│   │   ├── models/      # Sequelize models
│   │   ├── migrations/  # Database migrations
│   │   └── index.ts     # Express server entry point
│   ├── tests/           # Jest tests
│   └── package.json     # Backend dependencies
├── client/              # Frontend (Next.js 14 + React + TypeScript + Tailwind)
│   └── app/             # Next.js App Router structure
└── docs/                # Project documentation
```

## What Was Built

### 1. Monorepo Setup
- Root `package.json` configured as workspace
- Separate `server/` and `client/` packages
- Shared tooling (ESLint, Prettier) configured

### 2. Backend Foundation
- **Express server** (`server/src/index.ts`)
  - Basic Express app with CORS and JSON middleware
  - Health check endpoint: `GET /api/health`
  - Database connection on startup
  - Runs on port 3001 (configurable via `PORT` env var)

- **Database Configuration** (`server/src/config/`)
  - `database.ts`: Sequelize instance for application code
  - `database.js`: Sequelize config for CLI tools (migrations)
  - Default database name: `solo_leveling`
  - Environment variables: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
  - `.env` file at project root (not committed)

### 3. Core Models (Sequelize)
All models use TypeScript with `declare` keyword to avoid shadowing Sequelize's getters/setters.

**Player** (`server/src/models/Player.ts`)
- Fields: `id`, `rank` (E|D|C|B|A|S|SS), `level`, `totalXp`, `createdAt`, `updatedAt`
- Associations: `hasOne(Stats)`, `hasMany(TaskLog)`
- TypeScript type: `PlayerAttributes`, `PlayerCreationAttributes`

**Stats** (`server/src/models/Stats.ts`)
- Fields: `id`, `playerId`, `physical`, `intelligence`, `discipline`, `charisma`, `confidence`, `creativity` (all 0-100)
- Associations: `belongsTo(Player)`
- Foreign key constraint on `playerId`

**Task** (`server/src/models/Task.ts`)
- Fields: `id`, `type`, `difficulty`, `description`, `targetStat`, `xpReward`, `deadline`, `createdAt`, `updatedAt`
- Associations: `hasMany(TaskLog)`

**TaskLog** (`server/src/models/TaskLog.ts`)
- Fields: `id`, `taskId`, `playerId`, `status`, `evidence`, `aiVerdict`, `createdAt`, `updatedAt`
- Associations: `belongsTo(Player)`, `belongsTo(Task)`
- Foreign key constraints on `taskId` and `playerId`

**Model Index** (`server/src/models/index.ts`)
- Exports all models as a single object: `{ Player, Stats, Task, TaskLog, sequelize }`
- Sets up all associations (1:1 Player↔Stats, 1:Many Player↔TaskLog, 1:Many Task↔TaskLog)

### 4. Database Migrations
- Migration system configured via `sequelize-cli`
- Initial migration: `20240101000000-create-initial-tables.js`
  - Creates all 4 tables with proper columns, types, and foreign keys
  - Includes indexes on foreign keys
- Run migrations: `cd server && npm run db:migrate`
- Rollback: `cd server && npm run db:migrate:undo`

### 5. Testing Setup
- Jest configured with `ts-jest` (`server/jest.config.js`)
- Test setup/teardown (`server/tests/setup.ts`)
  - Syncs database before tests
  - Cleans up data after each test
  - Closes connection after all tests
- **Minimal tests implemented:**
  - `database.test.ts`: Database connection verification
  - `associations.test.ts`: Player → Stats 1:1 relationship test
- Run tests: `cd server && npm test`

### 6. Frontend Foundation
- Next.js 14 with App Router initialized
- TypeScript configured
- Tailwind CSS configured
- Basic structure in place (no UI implemented yet)

## Key Technical Decisions

1. **TypeScript Models**: All Sequelize models use `declare` for attributes to prevent shadowing Sequelize's internal getters/setters. This was critical for proper model behavior.

2. **Environment Variables**: `.env` file at project root. Both `database.ts` and `database.js` explicitly resolve the `.env` path to ensure CLI tools can access it.

3. **Database Name**: Default is `solo_leveling` (not `rl_sls`). Test database uses `solo_leveling_test`.

4. **Model Exports**: Models exported as a single object from `index.ts` for easier imports and association setup.

5. **Development vs Production**: 
   - Development: Models auto-sync on server start (for convenience)
   - Production: Use migrations only (no auto-sync)

## Important Files for Phase 2

- **Models**: `server/src/models/` - All models ready, associations configured
- **Database**: `server/src/config/database.ts` - Sequelize instance ready
- **Server**: `server/src/index.ts` - Express app ready for route additions
- **Migrations**: `server/src/migrations/` - Migration system ready

## What Phase 2 Needs to Build

Phase 2 will create service layer files in `server/src/services/`:
- `stat.service.ts` - Stat manipulation and decay logic
- `xp.service.ts` - XP, level, and rank calculations
- `task.service.ts` - Task generation and submission handling
- `penalty.service.ts` - Penalty application logic

These services will use the models from `server/src/models/index.ts` and the Sequelize instance from `server/src/config/database.ts`.

## Environment Variables Required

```env
DB_NAME=solo_leveling
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
PORT=3001
NODE_ENV=development
```

## Running the Project

1. **Setup database:**
   ```bash
   createdb solo_leveling
   cd server
   npm run db:migrate
   ```

2. **Start backend:**
   ```bash
   cd server
   npm run dev
   ```

3. **Run tests:**
   ```bash
   cd server
   npm test
   ```

## Notes for Phase 2

- Models are fully typed and ready to use
- Associations are configured - use `include` in queries to load related data
- Database connection is established - services can import `sequelize` or use models directly
- Express app is ready - add routes in `server/src/index.ts` or create a routes folder
- All tests pass - maintain test coverage as services are added
