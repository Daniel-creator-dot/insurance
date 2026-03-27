# Commission Rates Implementation Guide

## Where This Data Goes in Your System

Your boss's commission rates govern the **maximum commission percentage** agents can earn on different insurance classes.

### Data Hierarchy:
```
Commission Rates (Master Data - Set by Management)
    ↓
Policies (Inherit max rates)
    ↓
Agents (Cannot exceed these rates)
```

## Your Boss's Commission Rates

| Class of Business | Agreed Rate (%) |
|-------------------|-----------------|
| Bonds | 20 |
| Fire | 21 |
| Contractors All Risk | 20 |
| Engineering | 20 |
| Accident | 20 |
| Marine Cargo | 12.5 |
| Marine Hull | 12.5 |
| Motor Comprehensive | 16.5 |
| Motor Third Party | 10 |
| Workmen's Compensation | 15 |

## System Configuration

This data is managed in:
1. **Database**: `commission_rates` table
2. **Backend API**: `/api/commission-rates`
3. **Frontend**: Settings → Commission Rates

## How to Seed the Data

### Option 1: Run the Seed Script (Recommended)

```bash
cd backend
npm run seed:commission
```

This will:
- Connect to your database
- Insert all 10 commission rates
- Skip duplicates if they already exist
- Show you a detailed log

### Option 2: Manual Entry via Settings

1. Go to **Settings** (gear icon)
2. Click **Commission Rates** tab
3. Click **Add Rate** button
4. Enter each rate manually

## Data Usage in Policies

When you create a policy:

```
Step 1: Select "Class of Business"
        ↓
Step 2: System looks up max commission rate
        ↓
Step 3: Max rate displays (e.g., Motor Comprehensive = 16.5%)
        ↓
Step 4: Agent cannot exceed this rate when entering commission
```

## Current Database Structure

```sql
CREATE TABLE commission_rates (
  id SERIAL PRIMARY KEY,
  class_of_business VARCHAR(255) UNIQUE NOT NULL,
  agreed_rate NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

```
GET    /api/commission-rates          → Get all rates
POST   /api/commission-rates          → Create new rate
PUT    /api/commission-rates/:id      → Update rate
DELETE /api/commission-rates/:id      → Delete rate
```

## Sample API Usage

```javascript
// Get all rates
GET /api/commission-rates

Response:
[
  { id: 1, class_of_business: "Bonds", agreed_rate: 20 },
  { id: 2, class_of_business: "Fire", agreed_rate: 21 },
  ...
]

// Create new rate
POST /api/commission-rates
Body: { class_of_business: "Bonds", agreed_rate: 20 }

// Update rate
PUT /api/commission-rates/1
Body: { agreed_rate: 22 }

// Delete rate
DELETE /api/commission-rates/1
```

## Next Steps

1. ✅ Ensure backend is running: `npm run dev` (in backend folder)
2. ✅ Seed the data: `npm run seed:commission`
3. ✅ Go to Settings and verify the rates appear
4. ✅ Update Policy form to validate against these rates
