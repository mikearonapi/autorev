# AutoRev Error Handling

**Last Generated:** December 15, 2024

## Purpose
Documents error handling conventions and patterns used throughout the AutoRev codebase.

## API Route Error Handling

### Standard Error Response Format

**Structure:**
```javascript
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE", // Optional structured code
}
```

**HTTP Status Codes:**
- `500` - Internal server error (database, external API failures)
- `400` - Bad request (validation errors, malformed input)
- `401` - Unauthorized (auth required but missing)
- `403` - Forbidden (auth present but insufficient permissions)
- `404` - Not found (resource doesn't exist)

### Error Handling Pattern

```javascript
export async function GET(request) {
  try {
    // Main logic
    const result = await serviceCall();
    return NextResponse.json(result);
  } catch (err) {
    console.error('[API/endpoint] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch data', code: 'FETCH_ERROR' }, 
      { status: 500 }
    );
  }
}
```

### Examples Found in Codebase

From `/app/api/events/route.js`:
```javascript
return NextResponse.json(
  { error: 'Failed to fetch events', code: 'EVENTS_FETCH_ERROR' },
  { status: 500 }
);
```

From `/app/api/cars/route.js`:
```javascript
return NextResponse.json(
  { error: 'Failed to fetch cars' }, 
  { status: 500 }
);
```

## Logging Conventions

### Standard Format
All error logging follows this pattern:
```javascript
console.error('[Context] Error:', error);
console.warn('[Context] Warning:', message);
console.log('[Context] Info:', data); // For debugging
```

### Context Prefixes Found

**API Routes:**
- `[API/cars]` - Car data endpoints
- `[API/events]` - Event endpoints  
- `[API/cron]` - Scheduled job endpoints

**Services:**
- `[eventsService]` - Event search service
- `[serviceName]` - Generic service pattern
- `[AutoRev]` - Client configuration messages

**Examples:**
```javascript
// From API routes
console.error('[API/cars] Error:', error);

// From services
console.warn('[eventsService] Supabase not configured');
console.warn('[eventsService] Could not geocode location:', locationInput);

// From configuration
console.log('[AutoRev] Supabase connected:', supabaseUrl);
```

## Component Error Handling

### Loading States
Standard three-state pattern:
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  async function fetchData() {
    try {
      setLoading(true);
      const response = await fetch('/api/endpoint');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch');
      }
      
      setData(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  fetchData();
}, []);

// Render logic
if (loading) return <LoadingSkeleton />;
if (error) return <ErrorState message={error} />;
```

### Error Boundaries
**NEEDS VERIFICATION** - No React Error Boundaries found in current analysis.

Pattern should be:
```javascript
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### Skeleton Components
Loading states implemented via skeleton components:
```javascript
export function EventCardSkeleton() {
  return (
    <div className={styles.cardWrapper}>
      <div className={`${styles.card} ${styles.skeleton}`}>
        <div className={styles.skeletonImage} />
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonText} />
      </div>
    </div>
  );
}
```

## Service Error Handling

### Configuration Validation
Services check for required configuration before proceeding:

```javascript
export async function serviceFunction(params = {}) {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[serviceName] Supabase not configured');
    return { data: [], total: 0 }; // Graceful degradation
  }
  
  try {
    // Main logic
  } catch (error) {
    console.error('[serviceName] Error:', error);
    throw error; // Re-throw for caller handling
  }
}
```

### Database Error Handling
Supabase errors are caught and logged:

```javascript
const { data, error } = await supabase
  .from('table')
  .select('*');

if (error) {
  console.error('[API/endpoint] Database error:', error);
  throw error;
}
```

## External API Error Handling

### Pattern for Third-Party APIs
```javascript
try {
  const response = await fetch(externalUrl);
  
  if (!response.ok) {
    throw new Error(`External API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('[serviceName] External API error:', error);
  // Return fallback data or re-throw based on criticality
  return null;
}
```

## Form Validation Error Patterns

### Client-Side Validation
**NEEDS VERIFICATION** - Specific form validation patterns not found in current analysis.

Expected pattern:
```javascript
const [errors, setErrors] = useState({});

const validateForm = (data) => {
  const newErrors = {};
  
  if (!data.field1) {
    newErrors.field1 = 'Field is required';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// In JSX
<input 
  className={errors.field1 ? styles.error : ''} 
  {...register} 
/>
{errors.field1 && <span className={styles.errorText}>{errors.field1}</span>}
```

## ESLint Disable Comments

Found minimal ESLint overrides:
- `./lib/alToolCache.js` - Contains `// @ts-ignore`
- `./scripts/populate-known-issues.js` - Contains `eslint-disable`
- `./app/api/cron/refresh-recalls/route.js` - Contains `eslint-disable`
- `./app/api/cron/refresh-complaints/route.js` - Contains `eslint-disable`

Main ESLint rule override in `.eslintrc.json`:
```json
{
  "rules": {
    "react/no-unescaped-entities": "off"
  }
}
```

## Silent Failure Prevention

### Anti-patterns to avoid:
```javascript
// BAD - Silent failure
try {
  await criticalOperation();
} catch (error) {
  // Error swallowed, user unaware of failure
}

// GOOD - Explicit handling
try {
  await criticalOperation();
} catch (error) {
  console.error('[Context] Critical error:', error);
  throw error; // OR return error state
}
```

### Configuration Checks
Services fail gracefully when not configured:
```javascript
if (!isSupabaseConfigured) {
  console.warn('[Service] Database not configured, using fallback');
  return { data: [], fallback: true };
}
```

## NEEDS VERIFICATION

- Whether React Error Boundaries are implemented for component error handling
- If form validation follows a consistent pattern across forms
- Whether external API failures have appropriate retry logic
- If critical errors are reported to an external error tracking service
- Whether all database operations have appropriate error handling










