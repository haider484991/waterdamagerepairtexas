# US Pickleball Directory - Deployment Guide

## 🎉 All Implementation Tasks Completed!

Your pickleball directory has been successfully transformed from a Plano, Texas business directory to a comprehensive US-wide pickleball directory.

## ✅ What's Been Done

### 1. Database Schema
- ✅ Created `states` table (25 top US states)
- ✅ Created `cities` table (200+ cities with pop > 10k)
- ✅ Updated `businesses` table (removed Plano defaults)
- ✅ Added indexes for state/city filtering
- ✅ Updated all relations and types

### 2. Pickleball Categories
- ✅ 5 pickleball-specific categories created
- ✅ All old categories removed from seed
- ✅ Google Places search queries updated

### 3. Multi-Location Support
- ✅ Google Places API updated for any city/state
- ✅ Multi-location sync endpoint created
- ✅ State and city landing pages created
- ✅ All Plano hardcoding removed

### 4. SEO & Branding
- ✅ Site rebranded to "US Pickleball Directory"
- ✅ Comprehensive schema markup implemented
- ✅ FAQ sections with AI search optimization
- ✅ Enhanced sitemap (states, cities, categories, businesses)
- ✅ Meta tags optimized for pickleball keywords

## 🚀 Deployment Steps

### Step 1: Create New Database

1. Go to [Neon.tech](https://neon.tech)
2. Create a **NEW** database project (don't use existing)
3. Copy the connection string
4. Create `.env.local` file:

```bash
# Copy from env.example
cp env.example .env.local
```

5. Update `.env.local` with your new database URL:

```env
DATABASE_URL="postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

### Step 2: Configure Environment Variables

Update these in `.env.local`:

```env
# Database (REQUIRED - use NEW database)
DATABASE_URL="your-new-neon-database-url"

# Auth (keep existing or generate new)
AUTH_SECRET="your-auth-secret"
AUTH_URL="http://localhost:3000"

# Google Places API (keep existing)
GOOGLE_PLACES_API_KEY="your-google-places-api-key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Site Config (update)
NEXT_PUBLIC_SITE_URL="https://pickleballcourts.io"
NEXT_PUBLIC_SITE_NAME="US Pickleball Directory"

# Email (keep existing)
GMAIL_USER="your-gmail@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"
CONTACT_EMAIL="your-contact-email@example.com"
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Database Migration

```bash
# Push schema to database
npm run db:push
```

This creates all tables:
- states
- cities
- categories
- businesses
- users
- reviews
- favorites
- business_claims

### Step 5: Seed Database

```bash
# Populate initial data
npm run db:seed
```

This will seed:
- ✅ 25 US states (Top states by population)
- ✅ 200+ cities (Population > 10,000)
- ✅ 5 pickleball categories
- ✅ 5 sample pickleball businesses
- ✅ 2 users (demo + admin)

**Login Credentials**:
- Demo: `demo@pickleballcourts.io` / `demo123`
- Admin: `admin@pickleballcourts.io` / `admin123`

### Step 6: Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

### Step 7: Test Key Pages

1. ✅ Homepage: http://localhost:3000
2. ✅ States: http://localhost:3000/states
3. ✅ State page: http://localhost:3000/states/california
4. ✅ City page: http://localhost:3000/states/california/los-angeles
5. ✅ Categories: http://localhost:3000/categories
6. ✅ Category: http://localhost:3000/categories/pickleball-courts-facilities
7. ✅ Search: http://localhost:3000/search
8. ✅ Sitemap: http://localhost:3000/sitemap.xml

### Step 8: Populate Pickleball Businesses

#### Option A: Sync Specific City

```bash
curl -X POST http://localhost:3000/api/admin/sync-multi-location \
  -H "Content-Type: application/json" \
  -d '{
    "stateCode": "CA",
    "cityName": "Los Angeles",
    "limit": 1
  }'
```

#### Option B: Sync Multiple Cities in a State

```bash
curl -X POST http://localhost:3000/api/admin/sync-multi-location \
  -H "Content-Type: application/json" \
  -d '{
    "stateCode": "TX",
    "limit": 5
  }'
```

#### Option C: Sync Specific Category

```bash
curl -X POST http://localhost:3000/api/admin/sync-multi-location \
  -H "Content-Type: application/json" \
  -d '{
    "categorySlug": "pickleball-courts-facilities",
    "stateCode": "FL",
    "limit": 3
  }'
```

#### Option D: Sync Top Cities Across Multiple States

```bash
curl -X POST http://localhost:3000/api/admin/sync-multi-location \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 3
  }'
```

**Note**: Start small (limit: 1-5) to test. Google Places API has rate limits.

### Step 9: Production Deployment

#### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

#### Environment Variables for Vercel

```
DATABASE_URL=your-production-neon-url
AUTH_SECRET=your-auth-secret
AUTH_URL=https://your-domain.com
GOOGLE_PLACES_API_KEY=your-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME=US Pickleball Directory
GMAIL_USER=your-gmail
GMAIL_APP_PASSWORD=your-app-password
CONTACT_EMAIL=your-contact-email
```

### Step 10: Post-Deployment SEO

1. **Submit Sitemap to Google Search Console**
   - URL: `https://your-domain.com/sitemap.xml`
   - Contains 400+ URLs (states, cities, categories, businesses)

2. **Test Rich Results**
   - Use [Google Rich Results Test](https://search.google.com/test/rich-results)
   - Test business pages for LocalBusiness schema
   - Test state/city pages for Place schema
   - Test category pages for FAQPage schema

3. **Monitor Indexing**
   - Check Google Search Console for crawl errors
   - Monitor which pages are being indexed
   - Track impressions and clicks

4. **Gradual Business Population**
   - Start with top 10 cities per state
   - Monitor API usage and costs
   - Expand to more cities based on traffic

## 📊 What to Expect

### Immediate Results
- ✅ Professional pickleball directory live
- ✅ 25 state landing pages
- ✅ 200+ city landing pages
- ✅ 5 category pages with rich content
- ✅ Sample businesses from seed data

### After First Sync (1-2 hours)
- ✅ 50-200 pickleball businesses (depending on limit)
- ✅ Real Google Places data (ratings, reviews, photos)
- ✅ Fully functional directory

### Within 1-2 Weeks
- ✅ Google starts indexing pages
- ✅ First organic search traffic
- ✅ Schema markup in search results

### Within 1-3 Months
- ✅ Strong rankings for "[city] pickleball" keywords
- ✅ Featured in AI search results (ChatGPT, Perplexity)
- ✅ Local search visibility
- ✅ 1000+ indexed pages

## 🎯 SEO Target Keywords

Your site is optimized to rank for:

### Primary Keywords
- "pickleball courts in [city]"
- "[state] pickleball clubs"
- "where to play pickleball [city]"
- "pickleball near me"
- "[city] pickleball leagues"

### Secondary Keywords
- "indoor pickleball courts [city]"
- "pickleball equipment stores [city]"
- "pickleball coaches in [city]"
- "pickleball tournaments [state]"
- "best pickleball facilities [city]"

### Long-Tail Keywords
- "beginner pickleball lessons [city]"
- "outdoor pickleball courts near [neighborhood]"
- "competitive pickleball leagues [city]"
- "where to buy pickleball paddles [city]"

## 🔧 Maintenance & Updates

### Regular Tasks

1. **Weekly**: Run multi-location sync for new cities
2. **Monthly**: Update existing business data (ratings, hours)
3. **Monthly**: Check Google Search Console for issues
4. **Quarterly**: Expand to more cities based on traffic

### Scaling Strategy

1. **Phase 1** (Month 1): Top 5 cities per state (125 cities)
2. **Phase 2** (Month 2-3): Top 10 cities per state (250 cities)
3. **Phase 3** (Month 4+): All cities > 10k population (1000+ cities)

## ⚠️ Important Notes

1. **API Costs**: Monitor Google Places API usage
   - ~$5 per 1000 Place Search requests
   - ~$3 per 1000 Place Details requests
   - Set up billing alerts

2. **Rate Limiting**: Built-in delays prevent API throttling
   - 300-500ms between requests
   - Batch processing for efficiency

3. **Data Quality**: All businesses auto-verified from Google Places
   - Ratings and reviews synced
   - Photos stored as references (fetched on-demand)
   - Hours and contact info included

4. **Database Costs**: Neon.tech free tier limits
   - 3GB storage (upgrade if needed)
   - Monitor usage as businesses grow

## 🆘 Troubleshooting

### Database Connection Error
```bash
# Verify connection string
npm run db:studio
```

### Seed Fails
```bash
# Check .env.local has DATABASE_URL
# Ensure db:push ran successfully first
npm run db:push
npm run db:seed
```

### Google Places API Error
- Check API key is valid
- Verify Places API is enabled in Google Cloud Console
- Check billing is enabled

### No Businesses Showing
- Run sync endpoint
- Check database has businesses: http://localhost:3000/api/businesses
- Verify city/state names match exactly

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Next.js Documentation](https://nextjs.org/docs)
- [Schema.org Documentation](https://schema.org/)

## ✨ Success!

Your US Pickleball Directory is ready to launch! 🏓🎉

For questions, refer to:
- `IMPLEMENTATION_SUMMARY.md` - Complete technical overview
- `README.md` - Project documentation
- Plan file - Original specifications

**Next Steps**: Follow the deployment steps above and start populating your directory with pickleball businesses!

