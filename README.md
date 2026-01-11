# RL-SLS - Real Solo Leveling

A real-life gamification system inspired by Solo Leveling.

## Project Structure

```
rl-sls/
├── server/          # Backend (Node.js + Express + Sequelize + PostgreSQL)
├── client/          # Frontend (Next.js + React + TypeScript)
└── docs/            # Documentation
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Setup database:
   ```bash
   # Create PostgreSQL database
   createdb solo_leveling

   # Run migrations
   cd server
   npm run db:migrate
   ```

5. Start development servers:
   ```bash
   npm run dev
   ```

This will start:
- Backend server on http://localhost:3001
- Frontend app on http://localhost:3000

## Development

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run db:migrate` - Run database migrations
- `npm run db:migrate:undo` - Rollback last migration

### Frontend

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Phase 1 Status

✅ Project structure initialized
✅ Backend dependencies configured
✅ Frontend dependencies configured
✅ TypeScript configs setup
✅ Environment variables structure
✅ ESLint/Prettier configured
✅ Sequelize instance and database connection
✅ Migration system setup
✅ Core models created (Player, Stats, Task, TaskLog)
✅ Model associations configured
✅ Initial migration created
✅ Minimal tests (database connection, associations)

## Next Steps

See `.cursor/plans/checklist.plan.md` for Phase 2 tasks.
