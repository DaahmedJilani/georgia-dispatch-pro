# Test Users Documentation

This document contains information about test users created for system validation and testing.

## Test User Credentials

All test users have the password: `TestPass123!`

### Company: Test Logistics LLC

| Email | Role | Access Level | What They Can See |
|-------|------|--------------|-------------------|
| `admin@testlogistics.com` | Admin | Full company access | All Test Logistics data, team management, settings |
| `sales@testlogistics.com` | Sales | Limited | Only loads/carriers where they're the sales agent |
| `dispatch@testlogistics.com` | Dispatcher | Operational | All loads, drivers, carriers, WIP board, map view |
| `treasury@testlogistics.com` | Treasury | Financial | Invoices, payments, Airwallex integration |
| `driver@testlogistics.com` | Driver | Portal only | Driver portal with assigned loads, location updates |

### Company: Demo Freight Corp

| Email | Role | Access Level | What They Can See |
|-------|------|--------------|-------------------|
| `admin@demofreight.com` | Admin | Full company access | All Demo Freight data, team management, settings |
| `sales@demofreight.com` | Sales | Limited | Only loads/carriers where they're the sales agent |
| `dispatch@demofreight.com` | Dispatcher | Operational | All loads, drivers, carriers, WIP board, map view |

### Master Admin

| Email | Role | Access Level | What They Can See |
|-------|------|--------------|-------------------|
| `ahmad@georgiaindustrials.com` | Master Admin | System-wide | Everything across all companies, company management |

## How to Seed Test Users

As a **Master Admin**, you can seed test users by calling the edge function:

```typescript
const { data, error } = await supabase.functions.invoke('seed-test-users');
```

Or create a button in your UI that triggers this function.

## Role-Based Access Matrix

### What Each Role Can Access:

#### Master Admin
- ✅ All companies and their data
- ✅ Company management dashboard
- ✅ All features across all companies
- ✅ System-wide analytics

#### Admin
- ✅ All company data (loads, drivers, carriers, invoices)
- ✅ Team management (invite users, assign roles)
- ✅ Company settings
- ✅ Analytics for their company
- ❌ Cannot see other companies' data

#### Sales
- ✅ View loads where they're the sales agent
- ✅ Create new loads
- ✅ Manage brokers and carriers
- ✅ View documents marked for sales
- ❌ Cannot see other sales agents' loads
- ❌ Cannot access admin features

#### Dispatcher
- ✅ View and manage all loads
- ✅ Assign drivers to loads
- ✅ WIP (Work In Progress) board
- ✅ Map view with driver locations
- ✅ Manage drivers and carriers
- ❌ Cannot access financial data
- ❌ Cannot manage team/settings

#### Treasury
- ✅ View and manage invoices
- ✅ Generate payment links (Airwallex)
- ✅ View payment status
- ✅ Financial analytics
- ❌ Cannot access operational data (loads, drivers)
- ❌ Cannot manage team

#### Driver
- ✅ Driver portal only
- ✅ View assigned loads
- ✅ Update location
- ✅ View documents marked for drivers
- ❌ Cannot access dispatcher view
- ❌ Cannot see other drivers' loads

## Testing Scenarios

### Scenario 1: Company Isolation
**Goal:** Verify users cannot see other companies' data

1. Login as `admin@testlogistics.com`
2. Navigate to Loads page
3. **Expected:** Only see Test Logistics loads (none from Demo Freight)

### Scenario 2: Role-Based Access
**Goal:** Verify sales agents only see their own loads

1. Login as `sales@testlogistics.com`
2. Navigate to Loads page
3. **Expected:** Only see loads where `sales_user_id` matches this user's ID

### Scenario 3: Master Admin Access
**Goal:** Verify master admin sees all companies

1. Login as `ahmad@georgiaindustrials.com`
2. Navigate to Master Admin dashboard
3. **Expected:** See Test Logistics, Demo Freight, and Georgia Industrials

### Scenario 4: Unauthorized Access Prevention
**Goal:** Verify users are redirected from unauthorized pages

1. Login as `treasury@testlogistics.com`
2. Try to navigate to `/team` (team management)
3. **Expected:** Redirected to `/treasury-dashboard`

### Scenario 5: Authentication Requirement
**Goal:** Verify unauthenticated users cannot access data

1. Open incognito window (not logged in)
2. Try to query the database API directly
3. **Expected:** 401 Unauthorized error

## Security Validation Checklist

- [ ] Unauthenticated users receive 401 errors on all protected routes
- [ ] Users can only see data from their own company
- [ ] Sales agents only see their assigned loads
- [ ] Drivers only see their assigned loads
- [ ] Treasury users cannot access operational dashboards
- [ ] Admins cannot see other companies' data
- [ ] Master admin can see all companies
- [ ] RoleGuard properly redirects unauthorized access attempts
- [ ] Profile data requires authentication to view
- [ ] Company data requires authentication to view

## Troubleshooting

### Test User Login Fails
- Verify the user was created successfully in the auth system
- Check that the profile was created with the correct company_id
- Verify the user_role was assigned properly

### User Sees Wrong Data
- Check RLS policies on the table
- Verify `get_user_company()` returns the correct company_id
- Check that `has_role()` returns the expected role

### Cross-Company Data Visible
- **CRITICAL SECURITY ISSUE** - Review RLS policies immediately
- Verify all policies use `company_id = get_user_company(auth.uid())`
- Check for policies with `TO public` that should be `TO authenticated`

## Notes for Developers

- Always test with multiple companies to verify isolation
- Use test users instead of real accounts for development
- Master admin account should be tightly controlled in production
- Test users can be deleted and recreated as needed
- All passwords are intentionally simple for testing (use strong passwords in production)
