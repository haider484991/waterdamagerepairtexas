# Admin Account Setup - PickleballCourts.io

## ✅ Admin Account Created Successfully!

Your admin account has been created and pushed to the database.

---

## 🔐 Login Credentials

### Admin Account (Full Access)
```
Email:    admin@pickleballcourts.io
Password: Admin123!
Role:     ADMIN
```

### Demo Account (Regular User)
```
Email:    demo@pickleballcourts.io
Password: demo123
Role:     USER
```

---

## 🌐 Login URLs

**Local Development:**
```
http://localhost:3000/login
```

**Production:**
```
https://pickleballcourts.io/login
```

---

## 🎛️ Admin Panel Access

After logging in as admin, you can access:

1. **Dashboard**: `/dashboard`
   - Shows "Admin Panel" button (only visible to admins)
   - View your activity and stats

2. **Admin Panel**: `/admin`
   - Main admin control center
   - Manage businesses, claims, users

3. **Bulk Sync**: `/admin/bulk-sync`
   - Sync thousands of businesses from Google Places
   - Select states and cities to sync
   - Real-time progress tracking

4. **Sync Status**: `/admin/sync-status`
   - View ongoing and completed sync jobs
   - Database statistics
   - Sync history

---

## 🔒 Admin Permissions

As an admin, you can:

✅ **Business Management**
- Approve/reject pending business submissions
- Edit business information
- Feature businesses on homepage
- Delete spam/duplicate listings

✅ **Bulk Sync Operations**
- Sync businesses from Google Places API
- Select specific states and cities
- Monitor sync progress in real-time
- View sync statistics

✅ **Claims Management**
- Review business ownership claims
- Approve/reject claim requests
- Verify business owners

✅ **User Management**
- View all users (coming soon)
- Manage user roles (coming soon)
- Ban/suspend users (coming soon)

---

## 🛡️ Security Features

### Protected Routes
All admin routes require authentication:
- `/api/admin/*` - Admin API endpoints
- `/admin/*` - Admin pages

### Authentication Check
```typescript
function isAdmin(email: string): boolean {
  return (
    email === "admin@pickleballcourts.io" ||
    email === "owner@pickleballcourts.io"
  );
}
```

### What's Protected
- ✅ Bulk sync operations
- ✅ Business approvals
- ✅ Claim management
- ✅ Sync status viewing
- ✅ All admin API calls

---

## ⚠️ IMPORTANT: Change Password

**After first login:**

1. Go to your profile/settings
2. Change the default password `Admin123!` to something secure
3. Use a strong password with:
   - At least 12 characters
   - Mix of uppercase and lowercase
   - Numbers and special characters

---

## 🚀 Quick Start Guide

### Step 1: Login
```bash
# Navigate to login page
https://pickleballcourts.io/login

# Enter credentials
Email: admin@pickleballcourts.io
Password: Admin123!
```

### Step 2: Access Admin Panel
```bash
# After login, go to dashboard
/dashboard

# Click "Admin Panel" button
# Or navigate directly to:
/admin
```

### Step 3: Run Bulk Sync (Optional)
```bash
# Go to bulk sync page
/admin/bulk-sync

# Select states/cities to sync
# Click "Start Sync"
# Monitor progress in real-time
```

### Step 4: Manage Content
```bash
# Review pending businesses
/admin/businesses

# Review claims
/admin/claims

# View statistics
/admin/stats
```

---

## 🔧 Useful Commands

### Push Database Changes
```bash
npm run db:push
```

### View Database in Browser
```bash
npm run db:studio
```

### Create Additional Admins (Secure Method)
**See `SECURITY_ADMIN_CREATION.md` for secure admin creation methods.**

DO NOT use scripts for admin creation - always use secure methods with environment variables or database studio.

---

## 📊 Admin Dashboard Features

### Current Features
- ✅ Business approvals
- ✅ Bulk sync from Google Places
- ✅ Claim management
- ✅ Real-time sync progress
- ✅ Database statistics

### Coming Soon
- 🔜 User management
- 🔜 Analytics dashboard
- 🔜 SEO performance tracking
- 🔜 Revenue reports (if monetized)
- 🔜 Email notifications

---

## 🐛 Troubleshooting

### Can't Login?
1. Check email is exactly: `admin@pickleballcourts.io`
2. Password is case-sensitive: `Admin123!`
3. Clear browser cache and cookies
4. Try incognito/private mode

### Don't See Admin Panel?
1. Verify you're logged in
2. Check email matches admin email
3. Go to `/dashboard` - should see "Admin Panel" button
4. Try logging out and back in

### Forgot Password?
Run this command to reset:
```bash
npm run create:admin
```
This will show the default password.

### Need Another Admin?
Edit `scripts/create-admin.ts` to add another email, or modify the `isAdmin` function in admin route files.

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors (F12)
2. Check server logs
3. Verify database connection
4. Check `.env.local` has correct values

---

## 🎯 Best Practices

### Security
- ✅ Change default password immediately
- ✅ Use strong passwords
- ✅ Don't share admin credentials
- ✅ Monitor admin activity logs
- ✅ Regularly update dependencies

### Operations
- ✅ Run bulk sync during low-traffic hours
- ✅ Monitor sync progress
- ✅ Review pending businesses regularly
- ✅ Keep database backups
- ✅ Test changes in development first

---

## 📚 Related Documentation

- `SECURITY_AUDIT.md` - Security best practices
- `SEO_OPTIMIZATION.md` - SEO configuration
- `SITEMAP_GUIDE.md` - Sitemap management
- `DEPLOYMENT_GUIDE.md` - Production deployment

---

**You're all set! 🎉**

Login and start managing your pickleball directory!

