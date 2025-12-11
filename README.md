# PickleballCourts.io

The most comprehensive pickleball directory in the United States. Find 10,000+ pickleball courts, clubs, leagues, equipment stores, coaches & tournaments nationwide. Built with Next.js 16, featuring real-time Google Places API integration, advanced search, and beautiful UI.

## Features

- **25 Business Categories** - Comprehensive coverage from dining to professional services
- **Advanced Search** - Real-time search with filters by category, neighborhood, rating, and price
- **Business Listings** - Detailed pages with photos, hours, contact info, and reviews
- **User Reviews** - Star ratings, written reviews, and helpful vote system
- **Favorites** - Save businesses to your personal list
- **Business Claiming** - Owners can verify and manage their listings
- **SEO Optimized** - Structured data, dynamic sitemaps, and meta tags
- **Mobile First** - Responsive design with bottom navigation for mobile
- **Dark Mode** - Beautiful dark theme with amber accents

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Maps**: Google Maps JavaScript API + Places API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon PostgreSQL database
- Google Cloud Platform account (for Maps/Places API)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd plano-directory
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# NextAuth.js
AUTH_SECRET="generate-a-secure-secret-here"
AUTH_URL="http://localhost:3000"

# Google APIs
GOOGLE_PLACES_API_KEY="your-google-places-api-key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="Plano Business Directory"
```

4. Push database schema:
```bash
npm run db:push
```

5. Seed the database with categories:
```bash
npm run db:seed
```

6. Run the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # User dashboard
│   ├── api/               # API routes
│   ├── business/          # Business detail pages
│   ├── categories/        # Category pages
│   └── search/            # Search page
├── components/
│   ├── business/          # Business cards, ratings
│   ├── layout/            # Header, Footer, Navigation
│   ├── search/            # Search bar, filters
│   ├── seo/               # JSON-LD components
│   └── ui/                # shadcn/ui components
├── hooks/                  # Custom React hooks
├── lib/
│   ├── auth/              # NextAuth configuration
│   ├── db/                # Drizzle schema and queries
│   ├── google-places/     # Google Places API client
│   └── seo/               # SEO utilities
└── types/                  # TypeScript type definitions
```

## Database Schema

- **users** - User accounts and profiles
- **categories** - 25 business categories with sections
- **businesses** - Business listings with details
- **reviews** - User reviews with ratings
- **favorites** - User saved businesses
- **business_claims** - Business ownership claims

## API Endpoints

- `GET /api/businesses` - Search and list businesses
- `GET /api/businesses/[slug]` - Get business details
- `POST /api/reviews` - Create a review
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites` - Remove from favorites
- `POST /api/claims` - Submit business claim

## Neighborhoods

- Legacy West
- Downtown Plano
- West Plano
- East Plano
- North Plano
- South Plano

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate migrations
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Drizzle Studio

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.
