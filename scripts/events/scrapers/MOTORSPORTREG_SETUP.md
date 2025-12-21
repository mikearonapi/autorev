# MotorsportReg API Integration Guide

## Current Status

The MotorsportReg API requires authentication for all useful endpoints. We have built the infrastructure but need API credentials to use it.

## How to Get API Access

### Option 1: OAuth Application (Recommended)

1. **Contact MotorsportReg** at their developer portal: https://api.motorsportreg.com/
2. **Register your application** by emailing them with:
   - App name: AutoRev Events Aggregator
   - Use case: Aggregating track day, autocross, and club events
   - Callback URL: (your callback for OAuth flow)
3. **Receive OAuth credentials** (consumer key and secret)
4. **Implement OAuth flow** using the provided client

### Option 2: Organization Admin Credentials

If you have admin access to any MotorsportReg organization:

1. Get your username and password
2. Find your Organization ID (35-character UUID)
3. Use Basic Auth + X-Organization-Id header

## Available Endpoints

### Unauthenticated (per-organization only)
```
GET /rest/calendars/organization/{organization_id}.json
GET /rest/calendars/organization/{organization_id}.rss
GET /rest/calendars/organization/{organization_id}.ics
```

### Authenticated
```
GET /rest/calendars.json - All events (with geo filtering)
GET /rest/calendars/venue/{venue_id}.json - Events by venue
GET /rest/calendars/type/{type_id}.json - Events by type
```

### GraphQL API (v2)
```
POST https://api-v2.motorsportreg.com/graphql
Header: x-api-key: YOUR_API_KEY
```

## Finding Organization IDs

Organization IDs are needed for unauthenticated access. To find them:

1. **From calendar embed code**: Many clubs embed MSR calendars using the org ID
2. **From MSR URLs**: Look at the network tab when viewing a club's MSR page
3. **Contact the club**: Ask them for their MSR organization ID

### Known Organizations (Need Verification)

| Organization | Type | Notes |
|-------------|------|-------|
| NASA Northeast | HPDE | Active, many events |
| NASA NorCal | HPDE | California events |
| NASA SoCal | HPDE | California events |
| Chin Track Days | HPDE | National coverage |
| Hooked On Driving | HPDE | National coverage |
| SCCA | Autocross | Many regions |
| PCA | Club | Porsche Club events |
| BMW CCA | Club | BMW Club events |

## Using the Client

Once you have credentials:

```javascript
import { 
  fetchOrganizationEvents,
  fetchVenueEvents,
  fetchEventsByType,
  transformEvent 
} from './motorsportreg-client.js';

// For organization calendars (may work without auth if org ID is correct)
const events = await fetchOrganizationEvents('YOUR_ORG_ID', {
  startDate: '2026-01-01',
  endDate: '2026-12-31',
});

// For authenticated requests
const events = await fetchEventsByType('HPDE', {
  postalCode: '22066',
  radius: 100,
  auth: {
    username: 'your-username',
    password: 'your-password',
    orgId: 'your-org-id',
  },
});

// Transform to our format
const transformed = events.map(transformEvent);
```

## Alternative: Manual Data Entry

Until API access is obtained, we're using:

1. **Web research** to find events
2. **JSON seed files** with curated data
3. **Manual seeders** to populate the database

See:
- `data/track-days-2026.json` - Track day events
- `data/autocross-2026.json` - Autocross events
- `seeders/seed-track-days.js` - Track day seeder
- `seeders/seed-autocross.js` - Autocross seeder

## Environment Variables

```bash
# Add to .env.local once obtained
MOTORSPORTREG_API_KEY=your-api-key
MOTORSPORTREG_CONSUMER_KEY=oauth-consumer-key
MOTORSPORTREG_CONSUMER_SECRET=oauth-consumer-secret
```

## Next Steps

1. **Apply for API access** at https://api.motorsportreg.com/
2. **Subscribe to developer mailing list** at motorsportreg-api-developers Google Group
3. **Test with organization IDs** once we discover them
4. **Build full integration** once credentials are obtained

## Resources

- API Documentation: https://api.motorsportreg.com/
- GraphQL Docs: https://api-v2.motorsportreg.com/graphql (schema introspection)
- WordPress Plugin: https://blog.motorsportreg.com/wordpress-calendar-plugin
- Developer Support: motorsportreg-api-developers@googlegroups.com









