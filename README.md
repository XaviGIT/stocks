# Stock Market Analysis Backend

A Node.js/Express backend for comprehensive stock market analysis, featuring company research, financial statement analysis, DCF valuation, and investment tracking.

## Features

- **Company Search & Profiles**: Search companies by ticker or name with Yahoo Finance integration
- **Financial Statements**: Complete balance sheets, income statements, and cash flow statements
- **DCF Valuation**: Pat Dorsey-style 10-year discounted cash flow analysis with sensitivity analysis
- **Investment Stories**: Personal investment thesis tracking with versioning
- **Financial Analysis**: Quick analysis tools and metrics calculation
- **Data Caching**: Intelligent caching to minimize API calls and improve performance

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Data Source**: Yahoo Finance API
- **Validation**: Zod schemas
- **Testing**: Vitest

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd stocks
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/stocks_db
PORT=3000
NODE_ENV=development
```

4. Set up the database
```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Open Drizzle Studio
npm run db:studio
```

5. Start the development server
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Overview

### Health Check
- `GET /api/v1/health` - Server health status

### Companies
- `GET /api/v1/companies?term=...` - Search companies
- `GET /api/v1/companies/:ticker` - Get company profile and financials
- `GET /api/v1/companies/:ticker/financials` - Quick financial metrics
- `GET /api/v1/companies/:ticker/financials/statements` - All financial statements

### Valuations
- `GET /api/v1/valuations/:ticker` - Get all valuations for a company
- `GET /api/v1/valuations/:ticker/latest` - Get latest valuation
- `POST /api/v1/valuations/:ticker` - Create new DCF valuation
- `PUT /api/v1/valuations/:ticker/:id` - Update valuation
- `DELETE /api/v1/valuations/:ticker/:id` - Delete valuation
- `POST /api/v1/valuations/:ticker/sensitivity` - Generate sensitivity analysis

### Stories
- `GET /api/v1/stories/:ticker` - Get investment story
- `POST /api/v1/stories/:ticker` - Create/update story
- `GET /api/v1/stories/:ticker/versions` - Get story versions

### Analysis
- `GET /api/v1/analysis/:ticker` - Get financial analysis

### Sectors (Temporarily Disabled)
Sector analysis endpoints are currently disabled while being redesigned.

## Scripts

```bash
# Development
npm run dev          # Start with hot reload
npm start           # Start production server

# Database
npm run db:generate # Generate migrations
npm run db:push     # Push schema changes
npm run db:migrate  # Run migrations
npm run db:studio   # Open Drizzle Studio

# Testing
npm test            # Run tests
```

## Data Flow

1. **Search**: User searches for company → DB lookup first, fallback to Yahoo Finance
2. **Profile**: Company profile fetched with financial statements
3. **Caching**: Data cached in PostgreSQL, price updated regularly
4. **Analysis**: Financial metrics calculated from cached data
5. **Valuation**: DCF calculations performed with user inputs

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system architecture.

## API Documentation

See [API.md](./API.md) for complete API reference with examples.

## Data Model

See [DATA_MODEL.md](./DATA_MODEL.md) for database schema and relationships.

## Valuation Methodology

See [VALUATION.md](./VALUATION.md) for DCF calculation details and examples.

## Development Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features and improvements.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC
