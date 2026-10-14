# Admin User Setup for LabCore ELIS

## Overview
The LabCore ELIS project does not include a built-in admin user seed mechanism. This directory contains scripts to create and manage admin users for development purposes.

## Security Notice
⚠️ **IMPORTANT**: The default credentials provided are for development only. Always change the default password before deploying to production!

## Default Credentials
- **Email**: `nikilpanchal5@gmail.com`
- **Password**: `mns987`
- **Employee Code**: `ADMIN001`
- **Role**: ADMIN

## Setup Methods

### Method 1: SQL Script (Recommended for Direct Database Access)
If you have direct access to the PostgreSQL database:

```bash
# Using psql
psql -U postgres -d labcore_elis -f scripts/create-admin.sql

# Or if using the connection string from .env
psql "postgresql://postgres:YOUR_PASSWORD@localhost:5432/labcore_elis" -f scripts/create-admin.sql
```

### Method 2: TypeScript Script (Using Application Database Connection)
If you prefer to use the application's database configuration:

```bash
# Create admin user
npm run create-admin

# Update admin password
npm run update-admin-password
```

### Method 3: Manual User Creation via API
Once the application is running, you can create an admin user via the registration endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeCode": "ADMIN001",
    "fullName": "System Administrator",
    "email": "nikilpanchal5@gmail.com",
    "password": "mns987",
    "role": "ADMIN"
  }'
```

## Password Hash Generation
To generate a new bcrypt hash for a custom password:

```bash
npm run generate-hash
```

This will output a bcrypt hash that you can use in the SQL script or update the database directly.

## Production Deployment Checklist
Before deploying to production:

1. ✅ Change the default admin password
2. ✅ Update the JWT_SECRET in .env to a strong random value
3. ✅ Ensure database security (firewall, SSL, strong passwords)
4. ✅ Review and update CORS settings if needed
5. ✅ Remove or restrict development endpoints
6. ✅ Set up proper backup and recovery procedures

## Troubleshooting

### Admin user already exists
If you see "Admin user already exists" when running the create script:

```bash
# Update the existing admin password
npm run update-admin-password
```

### Database connection issues
Ensure your .env file has the correct DATABASE_URL and that PostgreSQL is running.

### Permission issues
Make sure the database user has CREATE and INSERT permissions on the users table.

## User Management via API
Once you have admin access, you can manage other users through the API:

- `POST /api/users` - Create new users
- `GET /api/users` - List all users  
- `PUT /api/users/:id` - Update user details
- `PATCH /api/users/:id/activate` - Activate user
- `PATCH /api/users/:id/suspend` - Suspend user
- `DELETE /api/users/:id` - Deactivate user

## Environment Variables
Required environment variables for authentication:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 12)
- `CLIENT_URL` - Frontend application URL for CORS