# Georgia Dispatch Pro - QA Testing Checklist

## Test Date: _______
## Tester: _______
## Environment: Production / Staging

---

## 1. Authentication & User Management
- [ ] User can sign up with email/password
- [ ] User can log in successfully
- [ ] User profile displays correct information
- [ ] Company assignment works correctly
- [ ] Multi-tenant data isolation verified (users only see their company data)
- [ ] Logout functionality works

## 2. Dashboard
- [ ] Dashboard loads without errors
- [ ] Total Loads count is accurate
- [ ] Active Loads count is accurate
- [ ] Drivers count is accurate
- [ ] Brokers count is accurate
- [ ] Recent loads display correctly with status badges
- [ ] Rate amounts display properly

## 3. Load Management
### Create Load
- [ ] "Create Load" button opens dialog
- [ ] All required fields validate properly (pickup/delivery address, city, state)
- [ ] Optional fields work (commodity, weight, distance, rate)
- [ ] Driver assignment dropdown populated
- [ ] Broker assignment dropdown populated
- [ ] Carrier assignment dropdown populated
- [ ] Load number auto-generates
- [ ] Load saves successfully to database
- [ ] Success toast notification appears

### View/Edit Load
- [ ] Clicking load opens details dialog
- [ ] All load information displays correctly
- [ ] Status badge shows correct status
- [ ] Pickup/delivery information visible
- [ ] Driver, broker, carrier assignments visible
- [ ] Rate and distance display correctly

### Load Status Updates
- [ ] Can change status from "pending" to "assigned"
- [ ] Can change status from "assigned" to "picked"
- [ ] Can change status from "picked" to "in_transit"
- [ ] Can change status from "in_transit" to "delivered"
- [ ] Status timeline updates correctly
- [ ] Status changes reflect immediately on dashboard

## 4. Driver Portal (`/driver-portal`)
### Driver Authentication
- [ ] Driver can access portal with their account
- [ ] Only assigned loads visible to driver
- [ ] GPS tracking indicator shows "active" status

### Load Actions
- [ ] Accept Load button works (status changes to "assigned")
- [ ] Reject Load button works (status changes to "pending", driver removed)
- [ ] "Mark as picked" button appears for assigned loads
- [ ] "Mark as in_transit" button appears for picked loads
- [ ] "Mark as delivered" button appears for in_transit loads
- [ ] Status transitions flow correctly

### POD Upload
- [ ] Upload POD button visible for in_transit/delivered loads
- [ ] File picker opens correctly
- [ ] Image/PDF upload succeeds
- [ ] Document saves to documents table
- [ ] Success notification appears

### GPS Tracking
- [ ] Browser requests location permission
- [ ] Location updates every 2 minutes (check driver table)
- [ ] Last location update timestamp updates
- [ ] Latitude/longitude values saved correctly

## 5. Map & GPS Tracking (`/map`)
### Map Display
- [ ] Google Maps loads correctly
- [ ] Map centers on appropriate location
- [ ] Map controls work (zoom, pan)

### Driver Markers
- [ ] All active drivers show on map
- [ ] Driver markers update in real-time (via Supabase Realtime)
- [ ] Clicking marker shows driver info
- [ ] Driver status reflected in marker color/icon

### Real-time Updates
- [ ] When driver location updates, map marker moves
- [ ] No page refresh required for updates
- [ ] Realtime subscription establishes successfully (check console)

## 6. Document Management
### Upload Documents
- [ ] Upload button works on load details
- [ ] File picker opens correctly
- [ ] Upload progress indicator shows
- [ ] Document saves successfully
- [ ] File metadata captured (name, size, type)
- [ ] Success notification appears

### View Documents
- [ ] Documents tab shows all load documents
- [ ] File names display correctly
- [ ] Upload date/time visible
- [ ] File size displays correctly
- [ ] Eye icon (view) works
- [ ] Download icon works

### AI Document Extraction
- [ ] Upload BOL/POD document
- [ ] Edge function `extract-document-data` called
- [ ] AI extracts pickup/delivery addresses
- [ ] AI extracts dates, commodity, weight, rate
- [ ] Extracted data auto-fills form fields
- [ ] Confidence scores displayed

## 7. Invoice Management (`/invoices`)
### Manual Invoice Creation
- [ ] Create invoice button works
- [ ] Load selection dropdown populated
- [ ] Broker selection dropdown populated
- [ ] Amount auto-fills from load rate
- [ ] Invoice number auto-generates (format: INV-YYYY-####)
- [ ] Due date calculates correctly (30 days from invoice date)
- [ ] Invoice saves successfully

### Auto Invoice Generation (Trigger)
- [ ] Change load status to "delivered"
- [ ] Check if invoice auto-created
- [ ] Invoice number sequential
- [ ] Amount matches load rate
- [ ] Status is "pending"
- [ ] Notes indicate "Auto-generated on delivery"

### Airwallex Payment Link
- [ ] Generate payment link button visible
- [ ] Click generates link (if Airwallex configured)
- [ ] Payment link saves to invoice record
- [ ] Payment link is valid URL
- [ ] Opening link shows payment page

## 8. SMS Notifications (Twilio)
### Load Assignment Notification
- [ ] Assign driver to load
- [ ] Check if trigger fires (may require manual testing)
- [ ] Driver receives SMS with load details
- [ ] SMS includes load number, pickup, delivery
- [ ] Phone number format correct

### Payment Link Notification
- [ ] Invoice with payment link created
- [ ] Broker receives SMS with link
- [ ] SMS formatting correct

## 9. Settings (`/settings`)
### Profile Settings
- [ ] User can update first/last name
- [ ] User can update phone number
- [ ] Changes save successfully

### Airwallex Settings
- [ ] Airwallex API Key field visible
- [ ] Airwallex Account ID field visible
- [ ] Can save credentials
- [ ] Credentials encrypted/stored securely
- [ ] Test connection button works (if implemented)

### Notification Preferences
- [ ] Email notifications toggle works
- [ ] SMS notifications toggle works
- [ ] Push notifications toggle works
- [ ] Preferences save correctly

## 10. Analytics (`/analytics`)
- [ ] Analytics page loads
- [ ] Charts render correctly
- [ ] Data aggregations accurate
- [ ] Date range filters work
- [ ] Export functionality works (if implemented)

## 11. Brokers/Carriers/Drivers Management
### Brokers
- [ ] View all brokers
- [ ] Create new broker
- [ ] Edit broker details
- [ ] Delete broker (if unused)
- [ ] Search/filter works

### Carriers
- [ ] View all carriers
- [ ] Create new carrier
- [ ] Edit carrier details
- [ ] Insurance expiry date tracked
- [ ] DOT/MC numbers validated

### Drivers
- [ ] View all drivers
- [ ] Create new driver
- [ ] Edit driver details
- [ ] Assign user account to driver
- [ ] License expiry tracking works
- [ ] Driver status updates (available, on_load, off_duty)

## 12. Real-time Features
### Supabase Realtime
- [ ] Drivers table subscribed to realtime
- [ ] Location updates propagate instantly
- [ ] Multiple users see same updates
- [ ] No console errors on realtime connection

## 13. Security & Access Control
### Row Level Security (RLS)
- [ ] Users only see their company's data
- [ ] Cannot access other companies' loads
- [ ] Cannot access other companies' drivers
- [ ] Admin role can manage company data
- [ ] Dispatcher role has proper permissions
- [ ] Driver role limited to assigned loads

### Edge Function Authentication
- [ ] Edge functions require valid JWT (verify_jwt = true)
- [ ] Unauthorized requests rejected
- [ ] CORS headers configured correctly

## 14. Performance & UX
- [ ] Page load times < 2 seconds
- [ ] No console errors on any page
- [ ] Mobile responsive on all pages
- [ ] Toast notifications clear and informative
- [ ] Loading states show during async operations
- [ ] Error messages user-friendly

## 15. Edge Cases
- [ ] Empty states display properly (no loads, no drivers)
- [ ] Search with no results handled
- [ ] Invalid form submissions prevented
- [ ] Network errors handled gracefully
- [ ] Large file uploads work (up to 20MB)
- [ ] Special characters in addresses handled

---

## Known Issues / Limitations

1. **Database Triggers (SMS/Invoice Auto-generation):**
   - Triggers created but require `app.settings` configuration
   - Workaround: Manual testing or configure HTTP settings

2. **Airwallex Integration:**
   - Requires company to add their own API credentials
   - Test with demo/sandbox credentials

3. **Document Storage:**
   - Documents table tracks metadata
   - Physical file storage in Supabase Storage bucket "documents"

4. **GPS Tracking:**
   - Requires browser location permission
   - May not work on non-HTTPS connections
   - Updates every 2 minutes (can be adjusted)

---

## Test Results Summary

| Module | Total Tests | Passed | Failed | Notes |
|--------|-------------|--------|--------|-------|
| Authentication | 6 | | | |
| Dashboard | 6 | | | |
| Load Management | 18 | | | |
| Driver Portal | 13 | | | |
| Map/GPS | 8 | | | |
| Documents | 13 | | | |
| Invoices | 12 | | | |
| SMS/Notifications | 5 | | | |
| Settings | 9 | | | |
| Security/RLS | 7 | | | |
| Performance | 6 | | | |
| Edge Cases | 6 | | | |
| **TOTAL** | **109** | | | |

**Overall Pass Rate:** ____%

**Critical Issues:** 
1. 
2. 

**Recommendations:**
1. 
2. 

**Approved for Production:** [ ] Yes  [ ] No

**Signature:** ________________  **Date:** ____________

---

## Testing Instructions

### Prerequisites
1. Ensure demo data is seeded (Georgia Industrials Inc with drivers, loads, etc.)
2. Have test user accounts ready (admin, dispatcher, driver roles)
3. Clear browser cache before starting
4. Use Chrome DevTools to monitor console logs

### Testing Workflow
1. Start with Authentication tests
2. Progress through each module sequentially
3. Mark each checkbox as you complete the test
4. Document any failures with screenshots
5. Note any unexpected behavior in the Notes column
6. Calculate pass rate at the end

### Reporting
- **Pass**: Feature works as expected
- **Fail**: Feature does not work or has errors
- **Partial**: Feature works but with minor issues
- **N/A**: Feature not applicable or not implemented yet

### Critical Path Tests (Must Pass)
1. User authentication and authorization
2. Load creation and status updates
3. Driver portal basic functionality
4. Document upload
5. Invoice creation
6. Data isolation between companies (RLS)

---

## Automation Opportunities

Future enhancements could include:
- Playwright/Cypress E2E test suite
- API integration tests for edge functions
- Load testing for concurrent users
- Automated visual regression testing
- CI/CD pipeline with automated testing

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-22  
**Maintained By:** Georgia Dispatch Pro Team
