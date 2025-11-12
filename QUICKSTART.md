# Quick Start Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ installed and running
- Git

## Step-by-Step Setup

### 1. Clone/Download the Project

```bash
cd fueleu-maritime
```

### 2. Install Dependencies

**Option A: Install all at once (recommended)**
```bash
npm run install:all
```

**Option B: Install separately**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Set Up Database

1. Create a PostgreSQL database:
```sql
CREATE DATABASE fueleu_maritime;
```

2. Configure backend environment:
```bash
cd backend
cp .env.example .env
```

3. Edit `backend/.env` with your database credentials:
```
DATABASE_URL="postgresql://username:password@localhost:5432/fueleu_maritime?schema=public"
PORT=3001
```

### 4. Initialize Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Or use the setup script:
```bash
npm run setup:backend
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Testing the Application

### 1. Routes Tab
- View all routes
- Filter by vessel type, fuel type, or year
- Set a route as baseline (click "Set Baseline")

### 2. Compare Tab
- After setting a baseline, view comparisons
- See percentage differences and compliance status
- View bar chart visualization

### 3. Banking Tab
- Enter Ship ID (e.g., "R001") and Year (e.g., 2025)
- View compliance balance
- Bank positive CB
- Apply banked CB to cover deficits

### 4. Pooling Tab
- Select year (e.g., 2025)
- Add ships to pool with adjusted CB values
- Create pool (validation will check rules automatically)

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env` file
- Ensure database exists: `psql -l | grep fueleu_maritime`

### Port Already in Use
- Backend: Change PORT in `backend/.env`
- Frontend: Update `frontend/vite.config.ts` port

### Prisma Issues
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate reset  # WARNING: This deletes all data
npm run prisma:seed
```

### Module Not Found Errors
```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

## Next Steps

- Review [README.md](./README.md) for detailed documentation
- Check [AGENT_WORKFLOW.md](./AGENT_WORKFLOW.md) for development insights
- Read [REFLECTION.md](./REFLECTION.md) for project reflection

---

**Happy coding! 🚢**

