# Quick Fix for Database Connection Error

## Problem
The "Database operation failed" error is occurring because:
1. WhatsApp integration changes caused TypeScript compilation errors
2. The backend server cannot start due to these errors
3. The Prisma client needs to be regenerated to match the schema

## Immediate Solution

### Option 1: Use the Built Version (if available)
If there's a built version, try:
```bash
cd backend
npm start
```

### Option 2: Fix TypeScript Issues in auth.ts
The TypeScript errors are in `api/src/lib/auth.ts` at lines 102 and 132. These are existing issues in the codebase, not related to WhatsApp integration.

### Option 3: Temporarily Disable TypeScript Checking
```bash
cd backend
npx.cmd ts-node --transpile-only ./api/src/server.ts
```

### Option 4: Check if Server is Already Running
The backend might already be running. Check if port 5000 is in use:
```bash
netstat -ano | findstr :5000
```

### Option 5: Simple Database Connection Test
Create a simple test script to verify database connection:

```javascript
// test-db.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
    return prisma.user.findFirst();
  })
  .then(user => {
    console.log('✅ Can query users:', user ? 'Yes' : 'No');
  })
  .catch(error => {
    console.error('❌ Database error:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  });
```

Run with:
```bash
cd backend
node test-db.js
```

## Check PostgreSQL
Make sure PostgreSQL is running:
```bash
# Check if PostgreSQL service is running
sc query postgresql-x64-14

# Or try to connect directly
psql -U postgres -d labcore_elis -h localhost
```

## Environment Variables
Verify your `.env` file has the correct database URL:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/labcore_elis"
```

## Frontend Connection
The frontend is trying to connect to the backend at the URL specified in the error. Make sure:
1. Backend is running on the expected port (5000)
2. CORS is configured to allow the frontend origin
3. The frontend API URL is correct

## Quick Steps to Try Right Now:

1. **Check if backend is already running:**
   ```bash
   netstat -ano | findstr :5000
   ```

2. **If not running, try starting with ts-node:**
   ```bash
   cd backend
   npx.cmd ts-node --transpile-only ./api/src/server.ts
   ```

3. **Test database connection separately:**
   ```bash
   cd backend
   node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.$connect().then(()=>console.log('DB OK')).catch(e=>console.error('DB Error:',e)).finally(()=>p.$disconnect());"
   ```

4. **Check PostgreSQL service:**
   ```bash
   sc query postgresql-x64-14
   ```

Let me know which of these works and we can proceed from there!