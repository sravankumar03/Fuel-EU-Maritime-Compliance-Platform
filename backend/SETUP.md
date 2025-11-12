# Backend Setup Instructions

## Step 1: Create `.env` file

Create a `.env` file in the `backend` directory with the following content:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/fueleu_maritime?schema=public"
PORT=3001
```

**Replace the placeholders:**
- `username`: Your PostgreSQL username (usually `postgres`)
- `password`: Your PostgreSQL password
- `localhost:5432`: Your PostgreSQL host and port (default is `localhost:5432`)
- `fueleu_maritime`: Your database name

## Step 2: Create the Database

Make sure PostgreSQL is running, then create the database:

```sql
CREATE DATABASE fueleu_maritime;
```

Or using psql command line:
```bash
psql -U postgres -c "CREATE DATABASE fueleu_maritime;"
```

## Step 3: Run Prisma Commands

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed
```

## Example `.env` file

If you're using the default PostgreSQL setup:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/fueleu_maritime?schema=public"
PORT=3001
```

## Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"
- Make sure the `.env` file exists in the `backend` directory
- Check that the file is named exactly `.env` (not `.env.txt` or `.env.example`)
- Verify the `DATABASE_URL` format is correct

### Error: "Can't reach database server"
- Make sure PostgreSQL is running
- Check that the host, port, username, and password are correct
- Verify the database exists

### Error: "Database does not exist"
- Create the database first (see Step 2)

