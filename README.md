# Fuel EU Maritime Compliance Platform

A full-stack compliance management system for Fuel EU Maritime regulations, built with Node.js, TypeScript, PostgreSQL, React, and TailwindCSS following Hexagonal Architecture principles.

## 📋 Overview

This platform helps maritime operators manage Fuel EU Maritime compliance by:

- **Route Management**: Track vessel routes with GHG intensity data and set baseline routes for comparison
- **Compliance Balance (CB)**: Calculate and monitor compliance balances using the Fuel EU methodology
- **Banking**: Bank positive compliance balances for future use and apply them to cover deficits
- **Pooling**: Create compliance pools where multiple ships can share compliance balances according to regulatory rules

## 🏗️ Architecture

The project follows **Hexagonal Architecture** (Ports & Adapters) for clean separation of concerns:

```
backend/
├── src/
│   ├── core/                    # Business logic (domain & application)
│   │   ├── domain/              # Domain entities
│   │   ├── application/         # Use cases & services
│   │   └── ports/               # Interfaces (repositories)
│   ├── adapters/
│   │   ├── inbound/http/        # Express routes (API endpoints)
│   │   └── outbound/postgres/   # Prisma repositories
│   └── infrastructure/
│       ├── db/                  # Database connection
│       └── server/              # Express server setup
└── prisma/                      # Database schema & migrations

frontend/
├── src/
│   ├── components/             # React components (Routes, Banking, Pooling)
│   ├── api/                     # API client
│   └── types/                   # TypeScript types
```

## 🚀 Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection:
```
DATABASE_URL="postgresql://user:password@localhost:5432/fueleu_maritime?schema=public"
PORT=3001
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed the database:
```bash
npm run prisma:seed
```

7. Start the backend server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📡 API Endpoints

### Routes

- `GET /api/routes` - Get all routes (with optional filters: `vesselType`, `fuelType`, `year`)
- `POST /api/routes/:id/baseline` - Set a route as baseline
- `GET /api/routes/comparison` - Compare routes against baseline

### Compliance

- `GET /api/compliance/cb?shipId={id}&year={year}` - Get compliance balance for a ship
- `GET /api/compliance/adjusted-cb?year={year}` - Get all compliance balances for a year

### Banking

- `GET /api/banking/records?shipId={id}&year={year}` - Get bank records
- `POST /api/banking/bank` - Bank positive compliance balance
  ```json
  {
    "shipId": "R001",
    "year": 2025,
    "cbAmount": 1000,
    "description": "Optional description"
  }
  ```
- `POST /api/banking/apply` - Apply banked balance to cover deficit
  ```json
  {
    "shipId": "R001",
    "year": 2025,
    "cbAmount": 500,
    "description": "Optional description"
  }
  ```

### Pooling

- `GET /api/pools?year={year}` - Get all pools for a year
- `POST /api/pools` - Create a new pool
  ```json
  {
    "name": "Container Fleet Pool 2025",
    "year": 2025,
    "members": [
      {
        "shipId": "R001",
        "adjustedCB": 1000
      },
      {
        "shipId": "R002",
        "adjustedCB": -500
      }
    ]
  }
  ```

## 🧮 Formulas

### Energy in Scope (MJ)
```
EnergyInScope = fuelConsumption × 41,000
```

### Compliance Balance (CB)
```
CB = (Target - Actual) × EnergyInScope
```

Where:
- **Target Intensity**: 89.3368 gCO₂e/MJ (2025 baseline)
- **Actual Intensity**: Route's GHG intensity
- **Positive CB**: Surplus (can be banked)
- **Negative CB**: Deficit (requires banking or pooling)

### Route Comparison
```
percentDiff = ((comparison / baseline) - 1) × 100
compliant = comparison <= baseline
```

### Pooling Rules

1. **Sum Rule**: `Sum(adjustedCB) ≥ 0`
2. **Deficit Protection**: Deficit ship cannot exit worse
3. **Surplus Protection**: Surplus ship cannot go negative

## 🧪 Testing

Run backend tests:
```bash
cd backend
npm run test
```

## 📊 Example Data

The seed script includes 5 sample routes:
- R001: Container, HFO, 2024
- R002: BulkCarrier, LNG, 2024
- R003: Tanker, MGO, 2024
- R004: RoRo, HFO, 2025
- R005: Container, LNG, 2025

## 🛠️ Development

### Backend
- **Build**: `npm run build`
- **Start**: `npm start`
- **Dev**: `npm run dev` (with hot reload)

### Frontend
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Dev**: `npm run dev` (with hot reload)

## 📝 Documentation

- [AGENT_WORKFLOW.md](./AGENT_WORKFLOW.md) - AI agent workflow and prompts
- [REFLECTION.md](./REFLECTION.md) - Project reflection and lessons learned

## 🎯 Features

### Routes Tab
- View all routes with filtering (vessel type, fuel type, year)
- Set baseline route for comparison
- Visual indicators for baseline status

### Compare Tab
- Compare routes against baseline
- Percentage difference calculation
- Compliance status (✅/❌)
- Bar chart visualization using Recharts

### Banking Tab
- View compliance balance for ships
- Bank positive CB for future use
- Apply banked CB to cover deficits
- Transaction history and balance tracking

### Pooling Tab
- Create compliance pools
- Add multiple ships to pools
- Real-time validation of pooling rules
- View CB before/after for each member

## 🔒 Validation Rules

### Banking
- Only positive CB can be banked
- Cannot bank more than available CB
- Cannot apply more than available banked balance

### Pooling
- Pool sum must be ≥ 0
- Deficit ships cannot exit worse
- Surplus ships cannot go negative
- All ships must have compliance data

## 📦 Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL

**Frontend:**
- React 18
- TypeScript
- TailwindCSS
- Recharts
- Vite

## 🤝 Contributing

This is an academic project. For questions or improvements, please refer to the assignment guidelines.

## 📄 License

This project is created for academic purposes.

---

**Built with ❤️ for Fuel EU Maritime Compliance**

