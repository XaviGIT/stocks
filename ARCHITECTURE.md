# Architecture Overview

## System Architecture

The stock analysis backend follows a layered architecture pattern with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│                    (Frontend Application)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│                    API Gateway                              │
│              (Express.js + Middleware)                     │
├─────────────────────────────────────────────────────────────┤
│  • CORS, Helmet, Morgan                                    │
│  • Request validation (Zod)                                │
│  • Error handling                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Route Layer                               │
│              (Express Router Modules)                       │
├─────────────────────────────────────────────────────────────┤
│  • /api/v1/companies  • /api/v1/valuations                 │
│  • /api/v1/analysis   • /api/v1/stories                    │
│  • /api/v1/sectors    (temporarily disabled)               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Controller Layer                            │
│            (Business Logic Controllers)                     │
├─────────────────────────────────────────────────────────────┤
│  • Request/Response handling                               │
│  • Input validation                                        │
│  • Error handling                                          │
│  • Response formatting                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Service Layer                              │
│              (Core Business Logic)                          │
├─────────────────────────────────────────────────────────────┤
│  • Yahoo Finance integration                               │
│  • DCF valuation calculations                              │
│  • Financial metrics computation                           │
│  • Data transformation                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Data Access Layer                           │
│              (Drizzle ORM + PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│  • Database queries                                        │
│  • Data relationships                                      │
│  • Transaction management                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 External Services                           │
│                  (Yahoo Finance)                            │
└─────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Server Configuration (`src/server.ts`)
- Express app setup
- Middleware configuration (CORS, Helmet, Morgan)
- Route mounting
- Error handling

### 2. Route Modules (`src/routes/`)
- **company.routes.ts**: Company search, profiles, financials
- **valuation.routes.ts**: DCF valuation CRUD operations
- **analysis.routes.ts**: Financial analysis endpoints
- **story.routes.ts**: Investment story management
- **sector.routes.ts**: Sector analysis (temporarily disabled)

### 3. Controllers (`src/controllers/`)
- **company.controller.ts**: Company data management
- **valuation.controller.ts**: Valuation operations
- **analysis.controller.ts**: Financial analysis
- **story.controller.ts**: Story management
- **sector.controller.ts**: Sector analysis (disabled)

### 4. Services (`src/services/`)
- **yahoo.service.ts**: Yahoo Finance API integration
- **valuation.service.ts**: DCF calculation engine
- **metrics.service.ts**: Financial metrics computation
- **quickAnalysis.service.ts**: Quick analysis tools
- **sector.service.ts**: Sector/industry analysis
- **industry.service.ts**: Industry-specific calculations

### 5. Database Layer (`src/db/`)
- **schema.ts**: Drizzle schema definitions
- **entities.ts**: Type exports
- **relations.ts**: Database relationships
- **connection.ts**: Database connection setup

### 6. Utilities (`src/utils.ts/`)
- **dates.ts**: Date manipulation utilities

## Data Flow

### Company Search Flow
```
User Search → Controller → Service → DB Query → Yahoo API (fallback) → Response
```

### Company Profile Flow
```
Ticker Request → Controller → Service → DB Check → Full Fetch (if needed) → Response
```

### Valuation Flow
```
Valuation Request → Controller → Validation → DCF Service → DB Store → Response
```

## Key Design Patterns

### 1. Repository Pattern
Database access is abstracted through Drizzle ORM, providing a clean interface for data operations.

### 2. Service Layer Pattern
Business logic is encapsulated in service classes, keeping controllers thin and focused on HTTP concerns.

### 3. Dependency Injection
Services are imported and used directly in controllers, maintaining loose coupling.

### 4. Error Handling
Centralized error handling with consistent error response formats across all endpoints.

## Data Caching Strategy

### Intelligent Caching
- **Company Data**: Cached in PostgreSQL with `lastFullFetch` timestamp
- **Price Updates**: Only price is refreshed regularly (every request)
- **Full Refresh**: Triggered by earnings dates or 90-day intervals
- **Financial Statements**: Cached until next full refresh

### Cache Invalidation
```typescript
// Full refresh triggers:
- Company not in database
- Next earnings date passed
- 90+ days since last full fetch
```

## External Integrations

### Yahoo Finance API
- **Search**: Company search by ticker/name
- **Quote**: Real-time price data
- **Fundamentals**: Financial statements and metrics
- **Rate Limiting**: Built-in with yahoo-finance2 library

## Database Schema

### Core Tables
- **companies**: Company profiles and metadata
- **balance_sheets**: Balance sheet data
- **income_statements**: Income statement data
- **cash_flow_statements**: Cash flow data
- **valuations**: DCF valuation scenarios
- **stock_stories**: Investment stories
- **sectors/industries**: Industry classification

### Relationships
- Companies → Sectors (many-to-one)
- Companies → Industries (many-to-one)
- Companies → Financial Statements (one-to-many)
- Companies → Valuations (one-to-many)
- Companies → Stories (one-to-one)

## Security Considerations

### Input Validation
- Zod schemas for all request validation
- Type checking at runtime
- SQL injection prevention through ORM

### Data Protection
- Helmet.js for security headers
- CORS configuration
- Input sanitization

## Performance Optimizations

### Database
- Indexed foreign keys
- Efficient queries with Drizzle
- Connection pooling

### API
- Response caching where appropriate
- Minimal data fetching
- Parallel data loading where possible

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- Database connection pooling
- External service rate limiting

### Vertical Scaling
- Efficient memory usage
- Optimized database queries
- Caching strategies

## Monitoring & Logging

### Logging
- Morgan for HTTP request logging
- Console logging for errors and important events
- Structured logging format

### Health Checks
- Basic health endpoint
- Database connectivity checks
- External service availability

## Future Architecture Considerations

### Microservices Migration
- Service extraction opportunities
- API gateway implementation
- Service discovery

### Event-Driven Architecture
- Event sourcing for audit trails
- Asynchronous processing
- Real-time updates

### Caching Layer
- Redis for session storage
- CDN for static assets
- Application-level caching
