# API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Currently no authentication is required. All endpoints are publicly accessible.

## Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details"
}
```

## Endpoints

### Health Check

#### GET /health
Check server health status.

**Response:**
- Status: `200 OK`
- Body: Empty (status code indicates health)

---

## Companies

### GET /companies
Search for companies by ticker or name.

**Query Parameters:**
- `term` (string, required): Search term (minimum 2 characters)

**Response:**
```json
[
  {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "exchange": "NASDAQ"
  }
]
```

**Example:**
```bash
GET /api/v1/companies?term=apple
```

### GET /companies/:ticker
Get comprehensive company profile with financial data.

**Path Parameters:**
- `ticker` (string): Company ticker symbol

**Response:**
```json
{
  "company": {
    "id": "uuid",
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "exchange": "NASDAQ",
    "sector": "Technology",
    "category": "Consumer Electronics",
    "price": "150.25",
    "shares": 15728700000,
    "website": "https://www.apple.com",
    "description": "Apple Inc. designs, manufactures...",
    "nextEarnings": "2024-01-25T00:00:00.000Z",
    "lastFullFetch": "2024-01-15T10:30:00.000Z",
    "sector": {
      "id": "uuid",
      "name": "Technology"
    }
  },
  "balanceSheets": [...],
  "incomeStatements": [...],
  "cashFlows": [...]
}
```

**Behavior:**
- If company not in DB: Full fetch from Yahoo Finance
- If company exists but stale: Price update only
- If company exists and fresh: Return cached data

### GET /companies/:ticker/financials
Get quick financial metrics snapshot.

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "shares": 15728700000,
  "currentFCF": 99803000000,
  "latestPeriod": "2023-09-30",
  "sector": "Technology",
  "debug": {
    "operatingCashFlow": 110543000000,
    "capitalExpenditures": -10713000000,
    "capExAdjusted": 10713000000,
    "calculation": "110543000000 + (10713000000) = 99803000000"
  }
}
```

### GET /companies/:ticker/financials/statements
Get all financial statements for a company.

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "sector": "Technology",
  "balanceSheets": [...],
  "incomeStatements": [...],
  "cashFlows": [...],
  "metadata": {
    "balanceSheetsCount": 10,
    "incomeStatementsCount": 10,
    "cashFlowsCount": 10,
    "oldestPeriod": "2014-09-27",
    "latestPeriod": "2023-09-30"
  }
}
```

---

## Valuations

### GET /valuations/:ticker
Get all valuations for a company.

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "valuations": [
    {
      "id": "uuid",
      "scenarioName": "Base Case",
      "discountRate": "10.00",
      "perpetualGrowthRate": "3.00",
      "sharesOutstanding": 15728700000,
      "fcfYear1": 100000000000,
      "fcfYear2": 110000000000,
      // ... fcfYear3 through fcfYear10
      "totalDiscountedFcf": 800000000000,
      "perpetuityValue": 2000000000000,
      "discountedPerpetuityValue": 800000000000,
      "totalEquityValue": 1600000000000,
      "intrinsicValuePerShare": "101.75",
      "notes": "Conservative growth assumptions",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### GET /valuations/:ticker/latest
Get the most recent valuation for a company.

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "valuation": {
    // Same structure as individual valuation above
  }
}
```

### POST /valuations/:ticker
Create a new DCF valuation.

**Request Body:**
```json
{
  "scenarioName": "Base Case",
  "discountRate": 10.0,
  "perpetualGrowthRate": 3.0,
  "sharesOutstanding": 15728700000,
  "fcfYear1": 100000000000,
  "fcfYear2": 110000000000,
  "fcfYear3": 121000000000,
  "fcfYear4": 133100000000,
  "fcfYear5": 146410000000,
  "fcfYear6": 161051000000,
  "fcfYear7": 177156100000,
  "fcfYear8": 194871710000,
  "fcfYear9": 214358881000,
  "fcfYear10": 235794769100,
  "notes": "Conservative growth assumptions"
}
```

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "valuation": {
    // Created valuation object
  },
  "calculation": {
    "discountedFcfs": [90909090909, 90909090909, ...],
    "marginOfSafety": "15.2%"
  }
}
```

### PUT /valuations/:ticker/:id
Update an existing valuation.

**Request Body:**
```json
{
  "scenarioName": "Updated Base Case",
  "discountRate": 9.5,
  "notes": "Updated assumptions"
}
```

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "valuation": {
    // Updated valuation object
  }
}
```

### DELETE /valuations/:ticker/:id
Delete a valuation.

**Response:**
```json
{
  "message": "Valuation deleted successfully",
  "deleted": {
    // Deleted valuation object
  }
}
```

### POST /valuations/:ticker/sensitivity
Generate sensitivity analysis for a valuation.

**Request Body:**
```json
{
  "valuationId": "uuid"
}
```

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "baseValuation": "101.75",
  "currentPrice": "150.25",
  "sensitivityTable": {
    "8%": {
      "2%": 95.50,
      "2.5%": 98.25,
      "3%": 101.00,
      "3.5%": 103.75,
      "4%": 106.50
    },
    "9%": {
      "2%": 89.75,
      "2.5%": 92.25,
      "3%": 94.75,
      "3.5%": 97.25,
      "4%": 99.75
    }
    // ... more discount rates
  }
}
```

---

## Stories

### GET /stories/:ticker
Get investment story for a company.

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "story": {
    "id": "uuid",
    "content": {
      "thesis": "Strong ecosystem and brand loyalty",
      "risks": "Market saturation, regulatory concerns",
      "catalysts": "New product launches, services growth"
    },
    "lastEdited": "2024-01-15T10:30:00.000Z"
  }
}
```

### POST /stories/:ticker
Create or update investment story.

**Request Body:**
```json
{
  "content": {
    "thesis": "Strong ecosystem and brand loyalty driving recurring revenue",
    "risks": "Market saturation in developed markets, regulatory concerns",
    "catalysts": "New product launches, services growth, emerging markets",
    "valuation": "Trading at reasonable multiple given growth prospects"
  }
}
```

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "story": {
    // Created/updated story object
  }
}
```

### GET /stories/:ticker/versions
Get all versions of an investment story.

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "versions": [
    {
      "id": "uuid",
      "version": 3,
      "content": { /* story content */ },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
    // ... more versions
  ]
}
```

---

## Analysis

### GET /analysis/:ticker
Get financial analysis for a company.

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "analysis": {
    "profitability": {
      "grossMargin": 45.2,
      "operatingMargin": 30.1,
      "netMargin": 25.8
    },
    "efficiency": {
      "roe": 147.4,
      "roa": 19.8,
      "roic": 28.5
    },
    "growth": {
      "revenueGrowth": 7.8,
      "earningsGrowth": 5.4,
      "fcfGrowth": 12.3
    }
  }
}
```

---

## Sectors (Temporarily Disabled)

The following sector analysis endpoints are currently disabled while being redesigned:

- `GET /sectors/list` - List all industries
- `GET /sectors/:ticker` - Industry analysis for company
- `GET /sectors/:ticker/peers` - Peer comparison
- `GET /sectors/industry/:industryName` - Industry details

These endpoints will return a 404 error until the sector analysis feature is re-enabled.

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting for production use.

## Pagination

Currently no pagination is implemented. Large result sets may need pagination in the future.

## Filtering and Sorting

Most endpoints return data in a default order (usually by date descending). Custom filtering and sorting may be added in future versions.
