# Data Model

## Database Schema Overview

The database uses PostgreSQL with Drizzle ORM. The schema is designed to support comprehensive stock analysis with normalized data structures and efficient querying.

## Core Tables

### Companies (`companies`)
Primary table storing company profiles and metadata.

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(10) NOT NULL UNIQUE,
  exchange VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  category VARCHAR(50),
  price DECIMAL(10,2),
  shares BIGINT,
  website VARCHAR(255),
  description TEXT,
  sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  industry_id UUID REFERENCES industries(id) ON DELETE SET NULL,
  next_earnings TIMESTAMP,
  last_full_fetch TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**Key Fields:**
- `ticker`: Stock symbol (e.g., "AAPL")
- `price`: Current stock price (stored as decimal)
- `shares`: Outstanding shares (bigint for large numbers)
- `sector_id`/`industry_id`: Classification references
- `next_earnings`: Next earnings date for refresh logic
- `last_full_fetch`: Timestamp for cache invalidation

### Company Metadata (`company_metadata`)
Extended company information for investment analysis.

```sql
CREATE TABLE company_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  ipo_date DATE,
  is_spinoff BOOLEAN DEFAULT FALSE,
  spinoff_date DATE,
  parent_company VARCHAR(255),
  market_cap_category VARCHAR(20), -- 'mega', 'large', 'mid', 'small', 'micro', 'nano'
  peter_lynch_category VARCHAR(50), -- 'stalwart', 'fast-grower', etc.
  is_business_stable BOOLEAN DEFAULT FALSE,
  can_understand_debt BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## Financial Statements

### Balance Sheets (`balance_sheets`)
Annual balance sheet data for each company.

```sql
CREATE TABLE balance_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  
  -- Current Assets
  cash_and_equivalents BIGINT,
  accounts_receivable BIGINT,
  inventories BIGINT,
  other_current_assets BIGINT,
  total_current_assets BIGINT,
  
  -- Non-Current Assets
  investiments BIGINT, -- Note: typo in schema
  property_plant_equipment BIGINT,
  goodwill BIGINT,
  intangible_assets BIGINT,
  other_assets BIGINT,
  total_assets BIGINT,
  
  -- Current Liabilities
  short_term_debt BIGINT,
  accounts_payable BIGINT,
  payroll BIGINT,
  income_taxes BIGINT,
  other_current_liabilities BIGINT,
  total_current_liabilities BIGINT,
  
  -- Non-Current Liabilities
  long_term_debt BIGINT,
  other_liabilities BIGINT,
  total_liabilities BIGINT,
  
  -- Equity
  common_stock BIGINT,
  retained_capital BIGINT,
  accumulated_compreensive_income BIGINT, -- Note: typo in schema
  total_stakeholders_equity BIGINT,
  total_liabilities_and_stakeholders_equity BIGINT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Income Statements (`income_statements`)
Annual income statement data.

```sql
CREATE TABLE income_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  
  -- Revenue and Cost
  net_sales BIGINT,
  cost_of_goods_sold BIGINT,
  gross_profit BIGINT,
  
  -- Operating Expenses
  selling_general_administrative BIGINT,
  research_and_development BIGINT,
  other_expenses_income BIGINT,
  operating_income BIGINT,
  
  -- Non-Operating Items
  interest_expense BIGINT,
  other_income_expense BIGINT,
  pretax_income BIGINT,
  
  -- Income and Taxes
  income_taxes BIGINT,
  net_income BIGINT,
  
  -- Per Share Data
  eps_basic DECIMAL(10,2),
  eps_diluted DECIMAL(10,2),
  
  -- Share Counts
  weighted_avg_shares_outstanding BIGINT,
  weighted_avg_shares_outstanding_diluted BIGINT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Cash Flow Statements (`cash_flow_statements`)
Annual cash flow statement data.

```sql
CREATE TABLE cash_flow_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  
  -- Operating Activities
  net_income BIGINT,
  depreciation_amortization BIGINT,
  deferred_income_tax BIGINT,
  pension_contribution BIGINT,
  
  -- Working Capital Changes
  accounts_receivable_change BIGINT,
  inventories_change BIGINT,
  other_current_assets_change BIGINT,
  other_assets_change BIGINT,
  accounts_payable_change BIGINT,
  other_liabilities_change BIGINT,
  net_cash_from_operations BIGINT,
  
  -- Investing Activities
  capital_expenditures BIGINT,
  acquisitions BIGINT,
  asset_sales BIGINT,
  other_investing_activities BIGINT,
  net_cash_from_investing BIGINT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## Valuation Tables

### Valuations (`valuations`)
DCF valuation scenarios and calculations.

```sql
CREATE TABLE valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  scenario_name VARCHAR(100) NOT NULL DEFAULT 'Base Case',
  
  -- Model Parameters
  discount_rate DECIMAL(5,2) NOT NULL, -- e.g., 10.00 for 10%
  perpetual_growth_rate DECIMAL(5,2) NOT NULL, -- e.g., 3.00 for 3%
  shares_outstanding BIGINT NOT NULL,
  
  -- 10-Year FCF Projections
  fcf_year_1 BIGINT,
  fcf_year_2 BIGINT,
  fcf_year_3 BIGINT,
  fcf_year_4 BIGINT,
  fcf_year_5 BIGINT,
  fcf_year_6 BIGINT,
  fcf_year_7 BIGINT,
  fcf_year_8 BIGINT,
  fcf_year_9 BIGINT,
  fcf_year_10 BIGINT,
  
  -- Calculated Results
  total_discounted_fcf BIGINT,
  perpetuity_value BIGINT,
  discounted_perpetuity_value BIGINT,
  total_equity_value BIGINT,
  intrinsic_value_per_share DECIMAL(10,2),
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## Story Management

### Stock Stories (`stock_stories`)
Investment thesis and story tracking.

```sql
CREATE TABLE stock_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}',
  last_edited TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Story Versions (`story_versions`)
Version history for investment stories.

```sql
CREATE TABLE story_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stock_stories(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## Industry Classification

### Sectors (`sectors`)
Broad industry sectors (e.g., Technology, Healthcare).

```sql
CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  industry VARCHAR(100),
  
  -- Aggregate Metrics
  avg_pe_ratio DECIMAL(10,2),
  avg_profit_margin DECIMAL(5,2),
  avg_revenue_growth DECIMAL(5,2),
  market_cap_total BIGINT,
  total_companies INTEGER DEFAULT 0,
  last_calculated TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Industries (`industries`)
Specific industries within sectors (e.g., Software, Biotechnology).

```sql
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL,
  
  -- Aggregate Metrics
  avg_pe_ratio DECIMAL(10,2),
  avg_profit_margin DECIMAL(5,2),
  avg_revenue_growth DECIMAL(5,2),
  market_cap_total BIGINT,
  total_companies INTEGER DEFAULT 0,
  last_calculated TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## Historical Metrics

### Sector Metrics History (`sector_metrics_history`)
Historical sector-level metrics for trend analysis.

```sql
CREATE TABLE sector_metrics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  
  avg_pe_ratio DECIMAL(10,2),
  avg_profit_margin DECIMAL(5,2),
  avg_revenue_growth DECIMAL(5,2),
  median_market_cap BIGINT,
  total_market_cap BIGINT,
  company_count INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Industry Metrics History (`industry_metrics_history`)
Historical industry-level metrics.

```sql
CREATE TABLE industry_metrics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  
  avg_pe_ratio DECIMAL(10,2),
  avg_profit_margin DECIMAL(5,2),
  avg_revenue_growth DECIMAL(5,2),
  median_market_cap BIGINT,
  total_market_cap BIGINT,
  company_count INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## Relationships

### Primary Relationships
```
companies (1) ←→ (1) company_metadata
companies (1) ←→ (*) balance_sheets
companies (1) ←→ (*) income_statements
companies (1) ←→ (*) cash_flow_statements
companies (1) ←→ (*) valuations
companies (1) ←→ (1) stock_stories
companies (1) ←→ (1) sectors
companies (1) ←→ (1) industries

sectors (1) ←→ (*) industries
sectors (1) ←→ (*) sector_metrics_history
industries (1) ←→ (*) industry_metrics_history

stock_stories (1) ←→ (*) story_versions
```

### Foreign Key Constraints
- All financial statements cascade delete with companies
- Valuations cascade delete with companies
- Stories cascade delete with companies
- Sectors/industries set null on company deletion
- Historical metrics cascade delete with parent entities

## Data Types

### Numeric Types
- `BIGINT`: Large numbers (shares, financial amounts)
- `DECIMAL(precision, scale)`: Precise decimal numbers (prices, ratios)
- `INTEGER`: Counts and small numbers

### Text Types
- `VARCHAR(length)`: Fixed-length strings (tickers, names)
- `TEXT`: Variable-length text (descriptions, notes)
- `JSONB`: Structured JSON data (story content)

### Temporal Types
- `TIMESTAMP`: Date and time with timezone
- `DATE`: Date only

## Indexes

### Primary Indexes
- All tables have UUID primary keys
- `companies.ticker` is unique
- `sectors.name` is unique
- `industries.name` is unique

### Foreign Key Indexes
- All foreign key columns are automatically indexed
- Composite indexes on `(company_id, period_date)` for financial statements

### Query Optimization Indexes
- `companies.sector_id` for sector-based queries
- `companies.industry_id` for industry-based queries
- `companies.last_full_fetch` for cache invalidation queries

## Data Integrity

### Constraints
- NOT NULL constraints on required fields
- CHECK constraints on numeric ranges where applicable
- UNIQUE constraints on business keys

### Validation
- Ticker format validation (uppercase, alphanumeric)
- Date range validation (period dates within reasonable ranges)
- Numeric validation (positive values for financial amounts)

## Migration Strategy

### Schema Evolution
- Drizzle migrations handle schema changes
- Backward compatibility maintained where possible
- Data migration scripts for breaking changes

### Data Quality
- Yahoo Finance data validation before insertion
- Duplicate detection and prevention
- Data consistency checks across related tables

## Performance Considerations

### Query Optimization
- Efficient joins using foreign key indexes
- Pagination for large result sets
- Selective column retrieval

### Storage Optimization
- Appropriate data types to minimize storage
- JSONB for flexible story content
- Compression for large text fields

### Caching Strategy
- Materialized views for complex aggregations
- Application-level caching for frequently accessed data
- Cache invalidation based on update timestamps
