# Vehicle Tracking API Implementation

**Created:** December 29, 2024  
**Feature:** Car Concierge Maintenance Tracking  
**Endpoint:** `PATCH /api/users/[userId]/vehicles/[vehicleId]`

---

## Overview

This API endpoint allows authenticated users to update maintenance tracking data for their vehicles in the garage. It supports all Car Concierge tracking fields including mileage, battery status, tire information, service dates, and more.

### Key Features

- ✅ **Comprehensive field support** - All maintenance tracking fields from DATABASE.md
- ✅ **Enum validation** - Validates battery_status against allowed values
- ✅ **Auto-computation** - Automatically computes next_oil_due_mileage based on car's oil change interval
- ✅ **Partial updates** - Only provided fields are updated
- ✅ **Full vehicle response** - Returns complete vehicle object after update
- ✅ **Auth enforcement** - Users can only update their own vehicles

---

## Implementation Files

### API Route
**File:** `app/api/users/[userId]/vehicles/[vehicleId]/route.js`

**Methods:**
- `GET` - Fetch specific vehicle with all details
- `PATCH` - Update vehicle tracking data
- `DELETE` - Remove vehicle from garage

### Test Suite
**File:** `tests/api-vehicle-tracking.test.js`

**Includes:**
- 7 usage examples
- 4 error examples
- Validation rules
- Edge cases
- Integration workflow test

---

## API Reference

### Endpoint

```
PATCH /api/users/[userId]/vehicles/[vehicleId]
```

### Authentication

**Required:** Yes (Bearer token or session cookie)

**Authorization:** User must own the vehicle (userId must match authenticated user)

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Request Body

All fields are optional. Only provide fields you want to update.

#### Maintenance Tracking Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `mileage` | number | Current odometer reading | `45000` |
| `last_started_at` | ISO date string | Last time vehicle was started | `"2024-12-28T10:30:00Z"` |
| `battery_status` | enum | Battery health status | `"good"` |
| `battery_installed_date` | ISO date string | When battery was last replaced | `"2024-01-15"` |
| `storage_mode` | boolean | Is vehicle in storage/not driven regularly | `true` |
| `tire_installed_date` | ISO date string | When current tires were installed | `"2024-11-01"` |
| `tire_brand_model` | string | Brand and model of current tires | `"Michelin Pilot Sport 4S"` |
| `tire_tread_32nds` | number | Tire tread depth in 32nds of an inch | `10` |
| `registration_due_date` | ISO date string | Registration renewal date | `"2025-05-01"` |
| `inspection_due_date` | ISO date string | Next inspection due date | `"2025-10-15"` |
| `last_inspection_date` | ISO date string | Last inspection date | `"2024-10-15"` |
| `last_oil_change_date` | ISO date string | Last oil change date | `"2024-12-15"` |
| `last_oil_change_mileage` | number | Odometer reading at last oil change | `44500` |
| `owner_notes` | string | User notes about the vehicle | `"Runs great after IMS bearing replacement"` |

#### Battery Status Enum

**Allowed values:** `"good"`, `"fair"`, `"weak"`, `"dead"`, `"unknown"`

**Default:** `"unknown"`

#### Basic Vehicle Info Fields

| Field | Type | Description |
|-------|------|-------------|
| `nickname` | string | Vehicle nickname |
| `color` | string | Vehicle color |
| `purchase_date` | ISO date string | Purchase date |
| `purchase_price` | number | Purchase price |
| `is_primary` | boolean | Is this the user's primary vehicle |
| `notes` | string | General vehicle notes |

#### Auto-Computed Fields

| Field | Computed From | Description |
|-------|---------------|-------------|
| `next_oil_due_mileage` | `last_oil_change_mileage` + car's `oil_change_interval_miles` | Next oil change due mileage |

**Note:** `next_oil_due_mileage` is automatically computed when `last_oil_change_mileage` is updated. The system fetches the vehicle's matched car slug, looks up the `oil_change_interval_miles` from `vehicle_maintenance_specs`, and adds it to the provided mileage.

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "vehicle": {
    "id": "uuid",
    "vin": "WP0AB29986S731234",
    "year": 2020,
    "make": "Porsche",
    "model": "718 Cayman",
    "trim": "GT4",
    "matched_car_slug": "718-cayman-gt4",
    "matched_car_id": "uuid",
    "matched_car_variant_id": "uuid",
    "nickname": "GT4 Beast",
    "color": "Carmine Red",
    "mileage": 45000,
    "purchase_date": "2024-01-15",
    "purchase_price": 95000,
    "is_primary": true,
    "ownership_status": "owned",
    "notes": "PPI clean, no issues",
    "last_started_at": "2024-12-28T10:30:00Z",
    "battery_status": "good",
    "battery_installed_date": "2024-01-10",
    "storage_mode": false,
    "tire_installed_date": "2024-11-01",
    "tire_brand_model": "Michelin Pilot Sport 4S",
    "tire_tread_32nds": 10,
    "registration_due_date": "2025-05-01",
    "inspection_due_date": "2025-10-15",
    "last_inspection_date": "2024-10-15",
    "last_oil_change_date": "2024-12-15",
    "last_oil_change_mileage": 44500,
    "next_oil_due_mileage": 52500,
    "owner_notes": "Runs great after IMS bearing replacement",
    "health_last_analyzed_at": null,
    "installed_modifications": [],
    "active_build_id": null,
    "total_hp_gain": 0,
    "modified_at": null,
    "custom_specs": {},
    "vin_decode_data": { ... },
    "created_at": "2024-01-20T10:00:00Z",
    "updated_at": "2024-12-29T15:30:00Z"
  },
  "message": "Vehicle updated successfully"
}
```

#### Error Responses

**400 Bad Request** - Invalid battery_status
```json
{
  "error": "Invalid battery_status. Must be one of: good, fair, weak, dead, unknown",
  "allowedValues": ["good", "fair", "weak", "dead", "unknown"]
}
```

**400 Bad Request** - No fields provided
```json
{
  "error": "No update fields provided"
}
```

**401 Unauthorized**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden** - Wrong user
```json
{
  "error": "Not authorized to modify this user's vehicles"
}
```

**404 Not Found** - Vehicle doesn't exist
```json
{
  "error": "Vehicle not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

---

## Usage Examples

### Example 1: Update Maintenance Tracking Fields

```javascript
const response = await fetch('/api/users/abc123/vehicles/vehicle-uuid-123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  },
  body: JSON.stringify({
    mileage: 45000,
    last_started_at: '2024-12-28T10:30:00Z',
    battery_status: 'good',
    last_oil_change_date: '2024-12-15',
    last_oil_change_mileage: 44500,
    owner_notes: 'Runs great after IMS bearing replacement',
  }),
});

const data = await response.json();
console.log(data.vehicle.next_oil_due_mileage); // 52500 (auto-computed)
```

### Example 2: Log Oil Change

```javascript
const response = await fetch('/api/users/abc123/vehicles/vehicle-uuid-123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  },
  body: JSON.stringify({
    last_oil_change_date: '2024-12-29',
    last_oil_change_mileage: 50000,
    mileage: 50000,
  }),
});

const data = await response.json();
// next_oil_due_mileage is auto-computed:
// 50000 + oil_change_interval_miles (from vehicle_maintenance_specs)
```

### Example 3: Update Tire Information

```javascript
const response = await fetch('/api/users/abc123/vehicles/vehicle-uuid-123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  },
  body: JSON.stringify({
    tire_installed_date: '2024-11-01',
    tire_brand_model: 'Michelin Pilot Sport 4S',
    tire_tread_32nds: 10, // 10/32nds ≈ 7.5mm (new tires)
  }),
});
```

### Example 4: Update Battery Status

```javascript
const response = await fetch('/api/users/abc123/vehicles/vehicle-uuid-123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  },
  body: JSON.stringify({
    battery_status: 'fair', // good, fair, weak, dead, unknown
    battery_installed_date: '2023-06-15',
    last_started_at: '2024-12-28T14:00:00Z',
  }),
});
```

### Example 5: Mark Vehicle as in Storage Mode

```javascript
const response = await fetch('/api/users/abc123/vehicles/vehicle-uuid-123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  },
  body: JSON.stringify({
    storage_mode: true,
    owner_notes: 'Stored for winter. On trickle charger.',
  }),
});
```

### Example 6: Update Inspection/Registration Dates

```javascript
const response = await fetch('/api/users/abc123/vehicles/vehicle-uuid-123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  },
  body: JSON.stringify({
    last_inspection_date: '2024-10-15',
    inspection_due_date: '2025-10-15',
    registration_due_date: '2025-05-01',
  }),
});
```

### Example 7: Update Basic Vehicle Info

```javascript
const response = await fetch('/api/users/abc123/vehicles/vehicle-uuid-123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  },
  body: JSON.stringify({
    nickname: 'GT4 Beast',
    color: 'Carmine Red',
    is_primary: true,
  }),
});
```

---

## Validation Rules

### battery_status

- **Type:** Enum
- **Allowed values:** `"good"`, `"fair"`, `"weak"`, `"dead"`, `"unknown"`
- **Default:** `"unknown"`
- **Validation:** Rejected if not in allowed list

### mileage

- **Type:** Number
- **Minimum:** 0
- **Note:** Should be current odometer reading

### last_oil_change_mileage

- **Type:** Number
- **Minimum:** 0
- **Side effect:** Auto-computes `next_oil_due_mileage` if vehicle has matched car with maintenance specs

### tire_tread_32nds

- **Type:** Number
- **Range:** 0-11/32nds
- **Note:** New tires are typically 10-11/32nds, replace at 2-3/32nds

### Date Fields

- **Format:** ISO 8601 date string (e.g., `"2024-12-29"` or `"2024-12-29T10:30:00Z"`)
- **Fields:** All date-related fields accept ISO 8601 format

---

## Auto-Computation Logic

### next_oil_due_mileage

**Triggered when:** `last_oil_change_mileage` is updated

**Computation:**
1. Fetch vehicle's `matched_car_slug`
2. Query `vehicle_maintenance_specs` table for `oil_change_interval_miles`
3. Compute: `next_oil_due_mileage = last_oil_change_mileage + oil_change_interval_miles`
4. Store computed value in `user_vehicles.next_oil_due_mileage`

**Example:**
- `last_oil_change_mileage`: 44500
- Car's `oil_change_interval_miles`: 8000 (from `vehicle_maintenance_specs`)
- **Result:** `next_oil_due_mileage` = 52500

**Edge Cases:**
- If vehicle has no `matched_car_slug`: `next_oil_due_mileage` is NOT computed
- If car slug has no maintenance specs: `next_oil_due_mileage` is NOT computed
- If `oil_change_interval_miles` is null: `next_oil_due_mileage` is NOT computed

---

## Edge Cases

### 1. Oil Change Without Matched Car

**Input:**
```json
{
  "last_oil_change_mileage": 50000
}
```

**Behavior:**
- Updates `last_oil_change_mileage` to 50000
- Does NOT compute `next_oil_due_mileage` (vehicle has no matched car)

### 2. Oil Change With Car But No Maintenance Specs

**Input:**
```json
{
  "last_oil_change_mileage": 50000
}
```

**Behavior:**
- Updates `last_oil_change_mileage` to 50000
- Does NOT compute `next_oil_due_mileage` (car has no maintenance specs in DB)

### 3. Null Values to Clear Fields

**Input:**
```json
{
  "battery_installed_date": null,
  "tire_installed_date": null,
  "owner_notes": null
}
```

**Behavior:**
- Sets fields to `null` (clears them)

### 4. Multiple Field Update

**Input:**
```json
{
  "mileage": 55000,
  "last_started_at": "2024-12-29T08:00:00Z",
  "battery_status": "good",
  "last_oil_change_date": "2024-12-20",
  "last_oil_change_mileage": 54500,
  "tire_tread_32nds": 8,
  "owner_notes": "Everything looking good after track day"
}
```

**Behavior:**
- All fields updated atomically in single transaction
- `next_oil_due_mileage` computed if car has maintenance specs

---

## Testing

### Manual Testing

See `tests/api-vehicle-tracking.test.js` for:
- 7 usage examples
- 4 error scenarios
- Integration workflow test
- Edge case documentation

### Running Tests

```bash
# Start dev server
npm run dev

# Get auth token
# Sign in to app and copy token from browser DevTools

# Update test file with:
# - Your user ID
# - Your vehicle ID
# - Your auth token

# Run integration test
node tests/api-vehicle-tracking.test.js
```

### Test Coverage

✅ Maintenance field updates  
✅ Oil change logging with auto-computation  
✅ Tire information tracking  
✅ Battery status updates  
✅ Storage mode toggling  
✅ Inspection/registration dates  
✅ Basic info updates  
✅ Invalid battery_status validation  
✅ Empty request body handling  
✅ Authentication enforcement  
✅ Authorization checks (wrong user)  
✅ Vehicle not found handling  

---

## Integration with Existing Code

### Existing Vehicle Routes

**Garage listing:**
- `GET /api/users/[userId]/garage` - List all vehicles

**Modifications:**
- `GET /api/users/[userId]/vehicles/[vehicleId]/modifications` - Get vehicle mods
- `POST /api/users/[userId]/vehicles/[vehicleId]/modifications` - Apply mods
- `DELETE /api/users/[userId]/vehicles/[vehicleId]/modifications` - Clear mods

**Custom specs:**
- `GET /api/users/[userId]/vehicles/[vehicleId]/custom-specs` - Get custom specs
- `POST /api/users/[userId]/vehicles/[vehicleId]/custom-specs` - Update custom specs

**New route (this implementation):**
- `GET /api/users/[userId]/vehicles/[vehicleId]` - Get single vehicle
- `PATCH /api/users/[userId]/vehicles/[vehicleId]` - **Update tracking data**
- `DELETE /api/users/[userId]/vehicles/[vehicleId]` - Delete vehicle

### Database Schema

**Table:** `user_vehicles`

**Columns used by this endpoint:**
- `mileage`
- `last_started_at`
- `battery_status` (enum: good/fair/weak/dead/unknown)
- `battery_installed_date`
- `storage_mode`
- `tire_installed_date`
- `tire_brand_model`
- `tire_tread_32nds`
- `registration_due_date`
- `inspection_due_date`
- `last_inspection_date`
- `last_oil_change_date`
- `last_oil_change_mileage`
- `next_oil_due_mileage` (auto-computed)
- `owner_notes`
- `nickname`
- `color`
- `purchase_date`
- `purchase_price`
- `is_primary`
- `notes`

**Related tables:**
- `vehicle_maintenance_specs` - Used to get `oil_change_interval_miles` for auto-computation

### userDataService.js

**Existing function:**
```javascript
export async function updateUserVehicle(userId, vehicleId, updates)
```

**Note:** The new PATCH endpoint does NOT use this service function. It implements the logic inline for:
1. Better control over field validation
2. Auto-computation logic for `next_oil_due_mileage`
3. Battery status enum validation
4. Full response with all vehicle fields

The service function is still available for other use cases that need simple updates without the tracking-specific logic.

---

## Security Considerations

### Authentication
- ✅ Requires valid JWT token or session cookie
- ✅ Uses Supabase RLS (Row Level Security)

### Authorization
- ✅ User can only update their own vehicles
- ✅ Verified by checking `user.id === userId`
- ✅ Database RLS enforces `user_id` match

### Input Validation
- ✅ Battery status validated against enum
- ✅ Date fields accept ISO 8601 format
- ✅ Numeric fields (mileage, tire tread) accept numbers
- ✅ No SQL injection risk (using Supabase client with parameterized queries)

### Data Integrity
- ✅ Auto-computation uses database values (not user input)
- ✅ Only updates provided fields (partial updates)
- ✅ Returns full vehicle object to confirm state

---

## Future Enhancements

### Potential Additions

1. **Service reminders calculation**
   - Compute due dates for services based on mileage and time
   - Example: "Oil change due in 300 miles or 2 months"

2. **Battery health scoring**
   - Track battery voltage readings over time
   - Predict battery replacement needs

3. **Tire wear tracking**
   - Calculate wear rate based on mileage and tread depth updates
   - Estimate replacement date

4. **Maintenance history timeline**
   - Store historical updates in separate table
   - Display timeline of all service events

5. **Cost tracking**
   - Track maintenance costs per service
   - Generate annual maintenance cost reports

6. **Photo uploads**
   - Allow users to attach photos to maintenance records
   - Visual documentation of work performed

7. **Service reminders push notifications**
   - Email/SMS when service is due
   - Integration with calendar apps

### Database Migrations Needed

None currently - all fields already exist in `user_vehicles` table.

---

## Changelog

**2024-12-29** - Initial implementation
- Created PATCH endpoint for vehicle tracking
- Added battery_status enum validation
- Implemented auto-computation for next_oil_due_mileage
- Created comprehensive test suite
- Documented all usage examples and edge cases

---

## References

- **DATABASE.md** - `user_vehicles` schema definition (lines 331-338)
- **API.md** - User routes patterns (lines 752-828)
- **lib/userDataService.js** - Existing vehicle CRUD functions (lines 423-541)
- **app/api/users/[userId]/garage/route.js** - Garage listing endpoint
- **app/api/users/[userId]/vehicles/[vehicleId]/modifications/route.js** - Modifications endpoint

---

## Support

For questions or issues:
1. Check test examples in `tests/api-vehicle-tracking.test.js`
2. Review edge cases in this document
3. Verify DATABASE.md schema matches expectations
4. Check Supabase RLS policies for `user_vehicles` table

