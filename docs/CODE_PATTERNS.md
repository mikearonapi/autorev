# AutoRev Code Patterns

**Last Generated:** January 21, 2026

## Purpose
Documents established coding patterns found in the AutoRev codebase through analysis of representative files.

## API Route Pattern

**Standard Structure** (based on `/app/api/cars/route.js`, `/app/api/events/route.js`):

```javascript
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { serviceFunction } from '@/lib/serviceFile';

/**
 * JSDoc comment with:
 * - Brief description
 * - Query parameters
 * - Response format
 * - Auth requirements
 */
export async function GET(request) {
  // Early return for unconfigured Supabase
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ data: [] }, { status: 200 });
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const param1 = searchParams.get('param1');
    const param2 = searchParams.get('param2');

    // Call service function
    const result = await serviceFunction({ param1, param2 });
    
    return NextResponse.json(result);
  } catch (err) {
    console.error('[API/endpoint] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch data' }, 
      { status: 500 }
    );
  }
}
```

**Key Patterns:**
- JSDoc comments for all endpoints
- Supabase configuration check before proceeding
- Consistent error logging with `[API/endpoint]` prefix
- URL searchParams parsing for query parameters
- Generic error messages in responses
- Try-catch wrapping all logic

## Component Pattern

**Standard Structure** (based on `EventCard.jsx`, `AIMechanicChat.jsx`):

```javascript
'use client';

/**
 * ComponentName Component
 * 
 * Brief description of purpose and functionality
 */

// React imports first
import { useState, useEffect, useMemo } from 'react';

// Next.js imports
import Link from 'next/link';
import Image from 'next/image';

// Component imports
import styles from './ComponentName.module.css';
import OtherComponent from './OtherComponent';

// Hook/provider imports
import { useAuth } from './providers/AuthProvider';

// Icons defined as const object
const Icons = {
  iconName: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {/* SVG paths */}
    </svg>
  ),
};

// Utility functions defined before component
function formatData(data) {
  // formatting logic
}

// Skeleton/Loading component (if needed)
export function ComponentNameSkeleton() {
  return <div className={styles.skeleton}>...</div>;
}

// Main component
export default function ComponentName({ 
  prop1,
  prop2 = defaultValue,
  onAction,
  className,
  ...otherProps 
}) {
  // State hooks
  const [state, setState] = useState(initialValue);
  
  // Custom hooks
  const { user } = useAuth();
  
  // Effects
  useEffect(() => {
    // effect logic
  }, [dependencies]);

  // Event handlers
  const handleEvent = useCallback((params) => {
    // handler logic
  }, [dependencies]);

  // Computed values
  const computedValue = useMemo(() => {
    // computation
  }, [dependencies]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Component JSX */}
    </div>
  );
}
```

**Key Patterns:**
- `'use client'` directive for client components
- Detailed component JSDoc comments
- Consistent import order: React → Next.js → Components → Styles → Providers
- Icons defined as const objects with size props
- Utility functions defined before component
- Loading skeleton components exported alongside main component
- Props destructuring with defaults
- CSS module usage with conditional classes
- Consistent event handler naming (`handleX`)

## Service/Lib Pattern

**Standard Structure** (based on `eventsService.js`, `supabase.js`):

```javascript
/**
 * Service Name
 * 
 * Description of service responsibilities
 * 
 * @module lib/serviceName
 */

// External imports
import externalLib from 'external-library';

// Internal imports  
import { supabase, isSupabaseConfigured } from './supabase.js';
import { helperFunction } from './helperService.js';

// Constants
const DEFAULT_VALUE = 20;
const MAX_VALUE = 100;

/**
 * Valid values for enumeration
 */
export const VALID_ENUM = ['value1', 'value2', 'value3'];

/**
 * Main service function
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.param1 - Description
 * @param {number} [params.param2=DEFAULT_VALUE] - Optional param
 * @returns {Promise<Object>} Response object
 */
export async function serviceFunction(params = {}) {
  // Early configuration check
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[serviceName] Supabase not configured');
    return { data: [], total: 0 };
  }

  try {
    // Parameter extraction and validation
    const { param1, param2 = DEFAULT_VALUE } = params;
    
    // Business logic
    const result = await supabase
      .from('table')
      .select('*')
      .eq('field', param1);

    return { data: result.data || [], total: result.data?.length || 0 };
  } catch (error) {
    console.error('[serviceName] Error:', error);
    throw error;
  }
}

export default { serviceFunction };
```

**Key Patterns:**
- Module-level JSDoc with `@module` tag
- Configuration checks before database operations
- Named exports preferred over default exports
- Constants defined in UPPER_CASE
- Comprehensive JSDoc for all functions with `@param` and `@returns`
- Error logging with service name prefix
- Graceful degradation when Supabase not configured
- Consistent parameter object destructuring

## Data Fetching Pattern

### Client-Side (in components):
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  async function fetchData() {
    try {
      const response = await fetch('/api/endpoint');
      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  fetchData();
}, []);
```

### Server-Side (in API routes):
```javascript
// Direct Supabase query
const { data, error } = await supabase
  .from('table')
  .select('fields')
  .eq('condition', value);

if (error) {
  console.error('[API/route] Error:', error);
  throw error;
}
```

## Error Handling Conventions

**Consistent Logging Format:**
```javascript
console.error('[Context] Error:', error);
console.warn('[Context] Warning:', message);
```

**API Error Responses:**
```javascript
return NextResponse.json(
  { error: 'Human-readable message', code: 'ERROR_CODE' },
  { status: 500 }
);
```

**Service Error Handling:**
```javascript
try {
  // operation
} catch (error) {
  console.error('[serviceName] Error:', error);
  throw error; // Re-throw for caller to handle
}
```

## Feature Gating Pattern

```javascript
import { hasAccess, IS_BETA } from '@/lib/tierAccess';

// In components
const canAccess = IS_BETA ? isAuthenticated : hasAccess(userTier, 'feature', isAuthenticated);

if (!IS_BETA && !canAccess) {
  return <PremiumGate feature="buildProjects" />;
}
```

## CSS Module Usage

```javascript
// Import
import styles from './Component.module.css';

// Usage - conditional classes
<div className={`${styles.base} ${active ? styles.active : ''} ${className || ''}`}>

// Usage - computed classes  
<div className={styles[`type-${event_type?.slug || 'default'}`]}>
```

## NEEDS VERIFICATION

- Whether all API routes follow the same auth checking pattern
- If error boundaries are implemented for component error handling
- Whether the feature gating pattern is consistently applied across all gated features











