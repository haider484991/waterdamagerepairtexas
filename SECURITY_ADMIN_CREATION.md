# SECURE Admin Account Creation

## ⚠️ SECURITY NOTICE

**DO NOT** commit admin creation scripts to git repositories. Admin account creation should be done securely through environment variables and secure processes.

---

## 🔒 Secure Method 1: Environment Variables + API Route

### Step 1: Add to `.env.local` (NEVER commit this file)

```bash
# Admin Creation Secret (generate a random string)
ADMIN_SECRET_KEY="your-super-secret-random-string-here-change-this"

# Optional: Set admin email
ADMIN_EMAIL="your-email@example.com"
```

### Step 2: Use the Existing API Route

The API route `/api/admin/create-admin` already exists and is protected by a secret key.

**Call it once in production:**

```bash
# Using curl
curl -X POST https://pickleballcourts.io/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{"secretKey": "your-super-secret-random-string-here-change-this"}'

# Or using Postman/Insomnia
POST https://pickleballcourts.io/api/admin/create-admin
Body: {"secretKey": "your-super-secret-random-string-here-change-this"}
```

**Response:**
```json
{
  "message": "Admin user created successfully",
  "email": "admin@pickleballcourts.io",
  "tempPassword": "Admin123!",
  "note": "Please change the password after first login!"
}
```

### Step 3: Delete the API Route After Use

For maximum security, delete or disable `/api/admin/create-admin` after creating your admin account.

---

## 🔒 Secure Method 2: Direct Database Access (Recommended)

### Using Database Studio

```bash
# Open your database GUI
npm run db:studio

# Manually insert into users table:
# email: admin@pickleballcourts.io
# passwordHash: (generate using bcrypt - see below)
# name: Admin
# role: admin
```

### Generate Password Hash

Create a temporary local script (DO NOT COMMIT):

```typescript
// temp-hash-password.ts (add to .gitignore)
import bcrypt from "bcryptjs";

const password = "YourSecurePassword123!"; // CHANGE THIS
const hash = bcrypt.hashSync(password, 12);
console.log("Hash:", hash);
```

```bash
# Run once
npx tsx temp-hash-password.ts

# Copy the hash and insert into database
# Then DELETE temp-hash-password.ts
```

---

## 🔒 Secure Method 3: Via Vercel/Deployment Platform

### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Set environment variable
vercel env add ADMIN_SECRET_KEY

# Deploy
vercel --prod

# Call the API endpoint once
curl -X POST https://pickleballcourts.io/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{"secretKey": "your-secret-key-from-vercel-env"}'

# Remove the environment variable after use
vercel env rm ADMIN_SECRET_KEY
```

---

## 🔒 Secure Method 4: PostgreSQL Command

If you have direct database access (Neon, Supabase, etc.):

```sql
-- Generate hash first using bcrypt (see method 2)
-- Then run this SQL:

INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@pickleballcourts.io',
  '$2a$12$YOUR_BCRYPT_HASH_HERE',  -- Replace with actual hash
  'Admin',
  'admin'
);
```

---

## ❌ What NOT To Do

### 🚫 DON'T: Commit Admin Scripts
```typescript
// ❌ BAD - This file should NOT be in git
// scripts/create-admin.ts
const adminEmail = "admin@example.com";
const adminPassword = "password123";
```

### 🚫 DON'T: Hardcode Credentials
```typescript
// ❌ BAD - Credentials in code
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";
```

### 🚫 DON'T: Use Seed Scripts in Production
```bash
# ❌ BAD - Seed scripts should only run in development
npm run db:seed  # This might create default admins
```

---

## ✅ Best Practices

### 1. Use Strong Passwords
```
❌ Bad:  admin123, password, Admin123
✅ Good: bK9$mP2#vL5@nR8!qW3^tY6&zX4*
```

### 2. Change Default Passwords Immediately
After first login, ALWAYS change the password.

### 3. Use Environment Variables
```bash
# .env.local (NEVER commit)
ADMIN_EMAIL=your-real-email@example.com
ADMIN_SECRET_KEY=generate-random-string-here
```

### 4. Limit Admin Creation
- Only create admin via secure methods
- Delete creation routes after use
- Never expose admin creation to public

### 5. Add `.gitignore` Protection
```gitignore
# Security - admin scripts
scripts/create-admin.ts
scripts/create-demo-user.ts
scripts/create-*.ts
temp-*.ts

# Never commit env files
.env*
```

---

## 🔐 Updating the Admin Creation Route

Make the route more secure by requiring environment variable:

```typescript
// src/app/api/admin/create-admin/route.ts
export async function POST(request: Request) {
  try {
    const { secretKey } = await request.json();

    // ✅ SECURE: Require environment variable
    const requiredSecret = process.env.ADMIN_SECRET_KEY;
    
    if (!requiredSecret) {
      return NextResponse.json(
        { error: "Admin creation is disabled" },
        { status: 503 }
      );
    }

    if (secretKey !== requiredSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ... rest of admin creation code
  }
}
```

---

## 🚨 If You've Already Committed Admin Scripts

### Immediate Actions:

1. **Remove the files:**
```bash
git rm scripts/create-admin.ts
git rm scripts/create-demo-user.ts
git commit -m "security: remove admin creation scripts"
```

2. **Change all passwords:**
```bash
# If scripts were public, assume passwords are compromised
# Login and change ALL admin passwords immediately
```

3. **Update `.gitignore`:**
```bash
echo "scripts/create-*.ts" >> .gitignore
git add .gitignore
git commit -m "security: prevent admin scripts from being committed"
```

4. **Review git history:**
```bash
# Check if sensitive data was committed
git log --all --full-history -- scripts/create-admin.ts

# If needed, purge from git history (use with caution)
git filter-branch --tree-filter 'rm -f scripts/create-admin.ts' HEAD
```

---

## 📚 Additional Security Measures

### 1. Rate Limiting
Add rate limiting to admin creation endpoint:

```typescript
// Limit to 3 attempts per hour
const rateLimit = new Map();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for");
  
  if (rateLimit.get(ip) > 3) {
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429 }
    );
  }
  
  // ... rest of code
}
```

### 2. IP Whitelist
Only allow admin creation from specific IPs:

```typescript
const ALLOWED_IPS = process.env.ADMIN_CREATION_IPS?.split(",") || [];

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for");
  
  if (!ALLOWED_IPS.includes(ip)) {
    return NextResponse.json(
      { error: "Unauthorized IP" },
      { status: 403 }
    );
  }
  
  // ... rest of code
}
```

### 3. Time-Limited Tokens
Use JWT or similar for one-time admin creation:

```typescript
// Generate token (offline, secure environment)
const token = jwt.sign(
  { action: "create-admin", exp: Date.now() + 3600000 },
  process.env.JWT_SECRET
);

// Use token once, then invalidate
```

---

## 📞 Summary

### ✅ DO:
- Use environment variables for secrets
- Require strong authentication for admin creation
- Delete/disable admin creation routes after use
- Add to `.gitignore`
- Use database studio for manual creation
- Change default passwords immediately

### ❌ DON'T:
- Commit admin creation scripts to git
- Hardcode credentials in code
- Leave admin creation routes publicly accessible
- Use weak passwords
- Share admin credentials

---

## 🎯 Recommended Approach

**For Production:**
1. Use the protected API route with environment variable secret key
2. Call it ONCE from a secure environment (your local machine, not from browser)
3. Immediately change the password after login
4. Delete or disable the admin creation route
5. Never commit any admin-related scripts

**For Development:**
1. Create local scripts with strong `.gitignore` rules
2. Use different credentials than production
3. Never use production credentials in development

---

**Remember: Security is not about convenience, it's about protection!** 🔒

